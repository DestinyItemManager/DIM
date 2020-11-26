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
import { searchFiltersConfigSelector } from '../search/search-filter';
import { setSetting } from '../settings/actions';
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
  isPhonePortrait: boolean;
  filters(query: string): ItemFilter;
}

function mapStateToProps(): MapStateToProps<StoreProps, ProvidedProps, RootState> {
  const filteredItemsSelector = createSelector(
    allItemsSelector,
    (_: RootState, ownProps: ProvidedProps) => ownProps.filterItems,
    (allitems, filterItems) => (filterItems ? allitems.filter(filterItems) : allitems)
  );

  return (state, ownProps) => ({
    allItems: filteredItemsSelector(state, ownProps),
    filters: searchFiltersConfigSelector(state),
    itemSortOrder: itemSortOrderSelector(state),
    isPhonePortrait: state.shell.isPhonePortrait,
  });
}

const mapDispatchToProps = {
  setSetting,
};
type DispatchProps = typeof mapDispatchToProps;

type Props = ProvidedProps & StoreProps & DispatchProps;

function ItemPicker({
  allItems,
  prompt,
  filters,
  itemSortOrder,
  sortBy,
  isPhonePortrait,
  ignoreSelectedPerks,
  onItemSelected,
  onCancel,
  onSheetClosed,
}: Props) {
  const [query, setQuery] = useState('');

  // On iOS at least, focusing the keyboard pushes the content off the screen
  const autoFocus =
    !isPhonePortrait && !(/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream);

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
      <h1 className="destiny">{prompt || t('ItemPicker.ChooseItem')}</h1>
      <div className="item-picker-search">
        <SearchBar
          placeholder={t('ItemPicker.SearchPlaceholder')}
          autoFocus={autoFocus}
          onQueryChanged={setQuery}
        />
      </div>
    </div>
  );

  const filter = useMemo(() => filters(query), [filters, query]);
  const items = useMemo(() => {
    let items = sortItems(allItems.filter(filter), itemSortOrder);
    if (sortBy) {
      items = _.sortBy(items, sortBy);
    }
    return items;
  }, [allItems, filter, itemSortOrder, sortBy]);

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
            <ConnectedInventoryItem
              key={item.index}
              item={item}
              onClick={() => onItemSelectedFn(item, onClose)}
              ignoreSelectedPerks={ignoreSelectedPerks}
            />
          ))}
        </div>
      )}
    </Sheet>
  );
}

export default connect<StoreProps, DispatchProps>(mapStateToProps, mapDispatchToProps)(ItemPicker);
