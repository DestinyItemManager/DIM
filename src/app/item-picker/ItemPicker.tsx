import ClassIcon from 'app/dim-ui/ClassIcon';
import { t } from 'app/i18next-t';
import { ItemFilter } from 'app/search/filter-types';
import SearchBar from 'app/search/SearchBar';
import { RootState } from 'app/store/types';
import _ from 'lodash';
import React, { useMemo, useState } from 'react';
import { connect, MapStateToProps } from 'react-redux';
import { createSelector } from 'reselect';
import Sheet from '../dim-ui/Sheet';
import ConnectedInventoryItem from '../inventory/ConnectedInventoryItem';
import { DimItem } from '../inventory/item-types';
import { allItemsSelector } from '../inventory/selectors';
import { filterFactorySelector } from '../search/search-filter';
import { itemSortOrderSelector } from '../settings/item-sort';
import { sortItems } from '../shell/filters';
import { ItemPickerState } from './item-picker';
import './ItemPicker.scss';

type ProvidedProps = ItemPickerState & {
  onSheetClosed(): void;
};

interface StoreProps {
  allItems: DimItem[];
  itemSortOrder: string[];
  filters(query: string): ItemFilter;
}

function mapStateToProps(): MapStateToProps<StoreProps, ProvidedProps, RootState> {
  const filteredItemsSelector = createSelector(
    allItemsSelector,
    (_state: RootState, ownProps: ProvidedProps) => ownProps.filterItems,
    (allitems, filterItems) => (filterItems ? allitems.filter(filterItems) : allitems)
  );

  return (state, ownProps) => ({
    allItems: filteredItemsSelector(state, ownProps),
    filters: filterFactorySelector(state),
    itemSortOrder: itemSortOrderSelector(state),
  });
}

type Props = ProvidedProps & StoreProps;

function ItemPicker({
  allItems,
  prompt,
  filters,
  itemSortOrder,
  sortBy,
  uniqueBy,
  ignoreSelectedPerks,
  onItemSelected,
  onCancel,
  onSheetClosed,
}: Props) {
  const [query, setQuery] = useState('');

  const onItemSelectedFn = (item: DimItem, onClose: () => void) => {
    onItemSelected({ item });
    onClose();
  };

  const onSheetClosedFn = () => {
    onCancel();
    onSheetClosed();
  };

  const header = (
    <div>
      <h1>{prompt || t('ItemPicker.ChooseItem')}</h1>
      <div className="item-picker-search">
        <SearchBar placeholder={t('ItemPicker.SearchPlaceholder')} onQueryChanged={setQuery} />
      </div>
    </div>
  );

  const filter = useMemo(() => filters(query), [filters, query]);
  const items = useMemo(() => {
    let items = sortItems(allItems.filter(filter), itemSortOrder);
    if (sortBy) {
      items = _.sortBy(items, sortBy);
    }
    if (uniqueBy) {
      items = _.uniqBy(items, uniqueBy);
    }
    return items;
  }, [allItems, filter, itemSortOrder, sortBy, uniqueBy]);

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
            <div key={item.index} className="item-picker-item">
              <ConnectedInventoryItem
                item={item}
                onClick={() => onItemSelectedFn(item, onClose)}
                ignoreSelectedPerks={ignoreSelectedPerks}
              />
              {item.type === 'Class' && (
                <ClassIcon classType={item.classType} className="item-picker-item-class-icon" />
              )}
            </div>
          ))}
        </div>
      )}
    </Sheet>
  );
}

export default connect<StoreProps>(mapStateToProps)(ItemPicker);
