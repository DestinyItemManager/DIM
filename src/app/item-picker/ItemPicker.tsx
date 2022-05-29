import ClassIcon from 'app/dim-ui/ClassIcon';
import { t } from 'app/i18next-t';
import { ItemFilter } from 'app/search/filter-types';
import SearchBar from 'app/search/SearchBar';
import { RootState } from 'app/store/types';
import { uniqBy } from 'app/utils/util';
import { BucketHashes } from 'data/d2/generated-enums';
import _ from 'lodash';
import { useCallback, useDeferredValue, useMemo, useState } from 'react';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import Sheet from '../dim-ui/Sheet';
import ConnectedInventoryItem from '../inventory/ConnectedInventoryItem';
import { DimItem } from '../inventory/item-types';
import { allItemsSelector } from '../inventory/selectors';
import { filterFactorySelector } from '../search/search-filter';
import { itemSorterSelector } from '../settings/item-sort';
import { ItemPickerState } from './item-picker';
import './ItemPicker.scss';

type ProvidedProps = ItemPickerState & {
  onSheetClosed(): void;
};

interface StoreProps {
  allItems: DimItem[];
  sortItems: (items: readonly DimItem[]) => readonly DimItem[];
  filters(query: string): ItemFilter;
}

function mapStateToProps() {
  const filteredItemsSelector = createSelector(
    allItemsSelector,
    (_state: RootState, ownProps: ProvidedProps) => ownProps.filterItems,
    (allitems, filterItems) => (filterItems ? allitems.filter(filterItems) : allitems)
  );

  return (state: RootState, ownProps: ProvidedProps) => ({
    allItems: filteredItemsSelector(state, ownProps),
    filters: filterFactorySelector(state),
    sortItems: itemSorterSelector(state),
  });
}

type Props = ProvidedProps & StoreProps;

function ItemPicker({
  allItems,
  prompt,
  filters,
  sortItems,
  sortBy,
  uniqueBy,
  onItemSelected,
  onCancel,
  onSheetClosed,
}: Props) {
  const [liveQuery, setQuery] = useState('');
  const query = useDeferredValue(liveQuery);

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
      <div className="item-picker-search">
        <SearchBar
          placeholder={t('ItemPicker.SearchPlaceholder')}
          onQueryChanged={setQuery}
          instant
        />
      </div>
    </div>
  );

  const filter = useMemo(() => filters(query), [filters, query]);
  const items = useMemo(() => {
    let items = sortItems(allItems.filter(filter));
    if (sortBy) {
      items = _.sortBy(items, sortBy);
    }
    if (uniqueBy) {
      items = uniqBy(items, uniqueBy);
    }
    return items;
  }, [allItems, filter, sortItems, sortBy, uniqueBy]);

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

export default connect<StoreProps, {}, ProvidedProps>(mapStateToProps)(ItemPicker);

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
        selectedSuperDisplay="disabled"
      />
      {item.bucket.hash === BucketHashes.Subclass && (
        <ClassIcon classType={item.classType} className="item-picker-item-class-icon" />
      )}
    </div>
  );
}
