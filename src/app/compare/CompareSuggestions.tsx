import { PressTip } from 'app/dim-ui/PressTip';
import { DimItem } from 'app/inventory/item-types';
import { filterFactorySelector } from 'app/search/items/item-search-filter';
import { canonicalizeQuery, parseQuery } from 'app/search/query-parser';
import clsx from 'clsx';
import { memo } from 'react';
import { useSelector } from 'react-redux';
import {
  armorSlotIcon,
  defaultComparisons,
  findSimilarArmors,
  findSimilarWeapons,
  weaponTypeIcon,
} from './compare-buttons';
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

  const keptPenultimateButton = false;

  // Filter out useless buttons
  const filteredCompareButtons = compareButtonsWithItems.filter((compareButton, index) => {
    const nextCompareButton = compareButtonsWithItems[index + 1];

    // always print the final button, unless it matched the penultimate button
    if (!nextCompareButton) {
      return !keptPenultimateButton;
    }
    // skip empty buttons or buttons that only contain the example item (except the first item-specific button and the example item specific button)
    if (
      compareButton.items.length < 2 &&
      !compareButton.query.includes('name:') &&
      !compareButton.query.includes('id:')
    ) {
      return false;
    }
    // if the next button has [all of, & only] the exact same items in it
    return !(
      compareButton.items.length === nextCompareButton?.items.length &&
      compareButton.items.every((setItem) =>
        nextCompareButton.items.some((nextSetItem) => nextSetItem === setItem),
      )
    );
  });

  const parsedQuery = currentQuery && canonicalizeQuery(parseQuery(currentQuery));

  return (
    <>
      <PressTip tooltip={currentQuery}>
        {exampleItem.bucket.inArmor
          ? armorSlotIcon(exampleItem)
          : exampleItem.bucket.inWeapons && weaponTypeIcon(exampleItem)}
      </PressTip>
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
          {!query.includes('id:') && <span>({items.length})</span>}
        </button>
      ))}
    </>
  );
});
