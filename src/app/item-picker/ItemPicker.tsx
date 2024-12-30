import ClassIcon from 'app/dim-ui/ClassIcon';
import { t } from 'app/i18next-t';
import { hideItemPopup, showItemPopup, showItemPopup$ } from 'app/item-popup/item-popup';
import SearchBar from 'app/search/SearchBar';
import { filterFactorySelector } from 'app/search/items/item-search-filter';
import { uniqBy } from 'app/utils/collections';
import { compareBy } from 'app/utils/comparators';
import { BucketHashes } from 'data/d2/generated-enums';
import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { mergeProps, useKeyboard, useLongPress, usePress } from 'react-aria';
import { useSelector } from 'react-redux';
import Sheet from '../dim-ui/Sheet';
import '../inventory-page/StoreBucket.scss';
import ConnectedInventoryItem from '../inventory/ConnectedInventoryItem';
import { DimItem } from '../inventory/item-types';
import { allItemsSelector } from '../inventory/selectors';
import { itemSorterSelector } from '../settings/item-sort';
import styles from './ItemPicker.m.scss';
import { ItemPickerState } from './item-picker';

export default function ItemPicker({
  prompt,
  filterItems,
  sortBy,
  uniqueBy,
  onItemSelected,
  onSheetClosed,
}: ItemPickerState & {
  onSheetClosed: () => void;
}) {
  const [liveQuery, setQuery] = useState('');
  const query = useDeferredValue(liveQuery);
  const allItems = useSelector(allItemsSelector);
  const filters = useSelector(filterFactorySelector);
  const sortItems = useSelector(itemSorterSelector);

  const onItemSelectedFn = useCallback(
    (item: DimItem, onClose: () => void) => {
      onItemSelected(item);
      onClose();
    },
    [onItemSelected],
  );

  const onSheetClosedFn = () => {
    onItemSelected(undefined);
    onSheetClosed();
  };

  const header = (
    <div>
      <h1>{prompt || t('ItemPicker.ChooseItem')}</h1>
      <SearchBar
        placeholder={t('ItemPicker.SearchPlaceholder')}
        onQueryChanged={setQuery}
        instant
      />
    </div>
  );

  // All items, filtered by the pre-filter configured on the item picker
  const filteredItems = useMemo(
    () => (filterItems ? allItems.filter(filterItems) : allItems),
    [allItems, filterItems],
  );
  // Further filtered by the search bar in the item picker
  const items = useMemo(() => {
    let items = sortItems(filteredItems.filter(filters(query)));
    if (sortBy) {
      items = items.toSorted(compareBy(sortBy));
    }
    if (uniqueBy) {
      items = uniqBy(items, uniqueBy);
    }
    return items;
  }, [sortItems, filteredItems, filters, query, sortBy, uniqueBy]);

  // TODO: have compact and "list" views
  // TODO: long press for item popup
  return (
    <Sheet
      onClose={onSheetClosedFn}
      header={header}
      freezeInitialHeight={true}
      allowClickThrough={true}
    >
      {({ onClose }) => (
        <div className={styles.grid}>
          {items.map((item) => (
            <ItemPickerItem
              key={item.index}
              item={item}
              onClose={onClose}
              onItemSelectedFn={onItemSelectedFn}
            />
          ))}
        </div>
      )}
    </Sheet>
  );
}

function ItemPickerItem({
  item,
  onClose,
  onItemSelectedFn,
}: {
  item: DimItem;
  onClose: () => void;
  onItemSelectedFn: (item: DimItem, onClose: () => void) => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const { longPressProps } = useLongPress({
    onLongPress: () => {
      showItemPopup(item, ref.current!);
    },
  });
  const { pressProps } = usePress({
    onPress: (e) => {
      if (e.shiftKey) {
        showItemPopup(item, ref.current!);
      } else if (showItemPopup$.getCurrentValue()?.item) {
        hideItemPopup();
      } else {
        onItemSelectedFn(item, onClose);
      }
    },
  });

  const { keyboardProps } = useKeyboard({
    onKeyDown: (e) => {
      if (e.key === 'i') {
        showItemPopup(item, ref.current!);
      }
    },
  });

  // Close the popup if this component is unmounted
  useEffect(
    () => () => {
      if (showItemPopup$.getCurrentValue()?.item?.index === item.index) {
        hideItemPopup();
      }
    },
    [item.index],
  );

  return (
    <button
      type="button"
      ref={ref}
      className={styles.itemPickerItem}
      aria-keyshortcuts="i"
      {...mergeProps(pressProps, longPressProps, keyboardProps)}
    >
      <ConnectedInventoryItem
        item={item}
        // don't show the selected Super ability on subclasses in the item picker because the active Super
        // ability is never relevant in the context that item picker is used
        hideSelectedSuper
      />
      {item.bucket.hash === BucketHashes.Subclass && (
        <ClassIcon classType={item.classType} className={styles.classIcon} />
      )}
    </button>
  );
}
