import ClassIcon from 'app/dim-ui/ClassIcon';
import { t } from 'app/i18next-t';
import SearchBar from 'app/search/ItemSearchBar';
import { uniqBy } from 'app/utils/util';
import { BucketHashes } from 'data/d2/generated-enums';
import _ from 'lodash';
import { useCallback, useDeferredValue, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import Sheet from '../dim-ui/Sheet';
import ConnectedInventoryItem from '../inventory/ConnectedInventoryItem';
import { DimItem } from '../inventory/item-types';
import { allItemsSelector } from '../inventory/selectors';
import { filterFactorySelector } from '../search/search-filter';
import { itemSorterSelector } from '../settings/item-sort';
import './ItemPicker.scss';
import { ItemPickerState } from './item-picker';

export default function ItemPicker({
  prompt,
  filterItems,
  sortBy,
  uniqueBy,
  onItemSelected,
  onCancel,
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
      onItemSelected({ item });
      onClose();
    },
    [onItemSelected]
  );

  const onSheetClosedFn = () => {
    onCancel();
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
    [allItems, filterItems]
  );
  // Further filtered by the search bar in the item picker
  const items = useMemo(() => {
    let items = sortItems(filteredItems.filter(filters(query)));
    if (sortBy) {
      items = _.sortBy(items, sortBy);
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
      sheetClassName="item-picker"
      freezeInitialHeight={true}
    >
      {({ onClose }) => (
        <div className="sub-bucket">
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
  const handleClick = useCallback(
    () => onItemSelectedFn(item, onClose),
    [item, onClose, onItemSelectedFn]
  );

  return (
    <div className="item-picker-item">
      <ConnectedInventoryItem
        item={item}
        onClick={handleClick}
        // don't show the selected Super ability on subclasses in the item picker because the active Super
        // ability is never relevant in the context that item picker is used
        hideSelectedSuper
      />
      {item.bucket.hash === BucketHashes.Subclass && (
        <ClassIcon classType={item.classType} className="item-picker-item-class-icon" />
      )}
    </div>
  );
}
