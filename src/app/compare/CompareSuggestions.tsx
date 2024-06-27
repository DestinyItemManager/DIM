import { DimItem } from 'app/inventory/item-types';
import { filterFactorySelector } from 'app/search/items/item-search-filter';
import { canonicalizeQuery, parseQuery } from 'app/search/query-parser';
import clsx from 'clsx';
import { memo } from 'react';
import { useSelector } from 'react-redux';
import { defaultComparisons, findSimilarArmors, findSimilarWeapons } from './compare-buttons';
import { compareCategoryItemsSelector, compareQuerySelector } from './selectors';

/**
 * Display a row of buttons that suggest alternate queries based on an example item.
 */
export default memo(function CompareSuggestions({
  exampleItem,
  onQueryChanged,
}: {
  exampleItem: DimItem;
  onQueryChanged: (query: string) => void;
}) {
  const currentQuery = useSelector(compareQuerySelector);
  const categoryItems = useSelector(compareCategoryItemsSelector);
  const filterFactory = useSelector(filterFactorySelector);

  // Find all possible buttons
  const compareButtons = exampleItem.bucket.inArmor
    ? findSimilarArmors(exampleItem)
    : exampleItem.bucket.inWeapons
      ? findSimilarWeapons(exampleItem)
      : defaultComparisons(exampleItem);

  // Fill in the items that match each query
  const compareButtonsWithItems = compareButtons.map((button) => ({
    ...button,
    items: categoryItems.filter(filterFactory(button.query)),
  }));

  let keptPenultimateButton = false;

  // Filter out useless buttons
  const filteredCompareButtons = compareButtonsWithItems.filter((compareButton, index) => {
    const nextCompareButton = compareButtonsWithItems[index + 1];

    // always print the final button, unless it matched the penultimate button
    if (!nextCompareButton) {
      return !keptPenultimateButton;
    }
    // skip empty buttons
    if (!compareButton.items.length) {
      return false;
    }
    // if the next button has [all of, & only] the exact same items in it
    if (
      compareButton.items.length === nextCompareButton?.items.length &&
      compareButton.items.every((setItem) =>
        nextCompareButton?.items.some((nextSetItem) => nextSetItem === setItem),
      )
    ) {
      // do include this button, if the next button is the "includes armor 2.0 items" button.
      // that's a confusing label to users with no armor 2.0 items.
      if (exampleItem.bucket.inArmor && !nextCompareButton?.query.includes('is:armor2.0')) {
        keptPenultimateButton = true;
        return true;
      }
      // otherwise skip it. it's a redundant button.
      return false;
    }
    return true;
  });

  const parsedQuery = currentQuery && canonicalizeQuery(parseQuery(currentQuery));

  return (
    <>
      {filteredCompareButtons.map(({ query, items, buttonLabel }) => (
        <button
          key={query}
          type="button"
          className={clsx('dim-button', {
            selected:
              parsedQuery !== undefined && canonicalizeQuery(parseQuery(query)) === parsedQuery,
          })}
          title={query}
          onClick={() => onQueryChanged(query)}
        >
          {buttonLabel.map((l) => (typeof l === 'string' ? <span key={l}>{l}</span> : l))}
          <span key="itemcount">({items.length})</span>
        </button>
      ))}
    </>
  );
});
