import { DimItem } from 'app/inventory-stores/item-types';
import { filterFactorySelector } from 'app/search/search-filter';
import React, { memo } from 'react';
import { useSelector } from 'react-redux';
import { defaultComparisons, findSimilarArmors, findSimilarWeapons } from './compare-buttons';
import { compareCategoryItemsSelector } from './selectors';

/**
 * Display a row of buttons that suggest alternate queries based on an example item.
 */
export default memo(function CompareSuggestions({
  exampleItem,
  onQueryChanged,
}: {
  exampleItem: DimItem;
  onQueryChanged(query: string): void;
}) {
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

  // Filter out useless buttons
  const filteredCompareButtons = compareButtonsWithItems.filter((compareButton, index) => {
    const nextCompareButton = compareButtonsWithItems[index + 1];
    // always print the final button
    if (!nextCompareButton) {
      return true;
    }
    // skip empty buttons
    if (!compareButton.items.length) {
      return false;
    }
    // skip if the next button has [all of, & only] the exact same items in it
    if (
      compareButton.items.length === nextCompareButton.items.length &&
      compareButton.items.every((setItem) =>
        nextCompareButton.items.some((nextSetItem) => nextSetItem === setItem)
      )
    ) {
      return false;
    }
    return true;
  });

  return (
    <>
      {filteredCompareButtons.map(({ query, items, buttonLabel }) => (
        <button
          key={query}
          type="button"
          className="dim-button"
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
