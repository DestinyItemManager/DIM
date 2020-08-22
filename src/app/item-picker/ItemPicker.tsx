import React, { useState, useRef, useEffect, useMemo } from 'react';
import { DimItem } from '../inventory/item-types';
import { ItemPickerState } from './item-picker';
import Sheet from '../dim-ui/Sheet';
import ConnectedInventoryItem from '../inventory/ConnectedInventoryItem';
import { connect, MapStateToProps } from 'react-redux';
import { RootState } from 'app/store/types';
import { createSelector } from 'reselect';
import { storesSelector } from '../inventory/selectors';
import { SearchFilters, searchFiltersConfigSelector } from '../search/search-filter';
import SearchFilterInput, { SearchFilterRef } from '../search/SearchFilterInput';
import { sortItems } from '../shell/filters';
import { itemSortOrderSelector } from '../settings/item-sort';
import clsx from 'clsx';
import { t } from 'app/i18next-t';
import './ItemPicker.scss';
import { setSetting } from '../settings/actions';
import _ from 'lodash';
import { settingsSelector } from 'app/settings/reducer';

type ProvidedProps = ItemPickerState & {
  onSheetClosed(): void;
};

interface StoreProps {
  allItems: DimItem[];
  filters: SearchFilters;
  itemSortOrder: string[];
  isPhonePortrait: boolean;
  preferEquip: boolean;
}

function mapStateToProps(): MapStateToProps<StoreProps, ProvidedProps, RootState> {
  const filteredItemsSelector = createSelector(
    storesSelector,
    (_: RootState, ownProps: ProvidedProps) => ownProps.filterItems,
    (stores, filterItems) =>
      stores.flatMap((s) => (filterItems ? s.items.filter(filterItems) : s.items))
  );

  return (state, ownProps) => ({
    allItems: filteredItemsSelector(state, ownProps),
    filters: searchFiltersConfigSelector(state),
    itemSortOrder: itemSortOrderSelector(state),
    isPhonePortrait: state.shell.isPhonePortrait,
    preferEquip: settingsSelector(state).itemPickerEquip,
  });
}

const mapDispatchToProps = {
  setSetting,
};
type DispatchProps = typeof mapDispatchToProps;

type Props = ProvidedProps & StoreProps & DispatchProps;

function ItemPicker({
  equip,
  preferEquip,
  allItems,
  prompt,
  filters,
  itemSortOrder,
  hideStoreEquip,
  sortBy,
  isPhonePortrait,
  ignoreSelectedPerks,
  onItemSelected,
  onCancel,
  onSheetClosed,
  setSetting,
}: Props) {
  const [query, setQuery] = useState('');
  const [equipToggled, setEquipToggled] = useState(equip ?? preferEquip);
  const [height, setHeight] = useState<number | undefined>(undefined);

  const itemContainer = useRef<HTMLDivElement>(null);
  const filterInput = useRef<SearchFilterRef>(null);

  useEffect(() => {
    if (itemContainer.current && !height) {
      setHeight(itemContainer.current.clientHeight);
    }
  }, [height]);

  // On iOS at least, focusing the keyboard pushes the content off the screen
  const autoFocus =
    !isPhonePortrait && !(/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream);

  const onItemSelectedFn = (item: DimItem, onClose: () => void) => {
    onItemSelected({ item, equip: equipToggled });
    onClose();
  };

  const onSheetClosedFn = () => {
    onCancel();
    onSheetClosed();
  };

  const setEquip = () => {
    setEquipToggled(true);
    setSetting('itemPickerEquip', true);
  };
  const setStore = () => {
    setEquipToggled(false);
    setSetting('itemPickerEquip', false);
  };

  const header = (
    <div>
      <h1 className="destiny">{prompt || t('ItemPicker.ChooseItem')}</h1>
      <div className="item-picker-search">
        <SearchFilterInput
          ref={filterInput}
          placeholder={t('ItemPicker.SearchPlaceholder')}
          autoFocus={autoFocus}
          onQueryChanged={setQuery}
        />
        {!hideStoreEquip && (
          <div className="split-buttons">
            <button
              type="button"
              className={clsx('dim-button', { selected: equipToggled })}
              onClick={setEquip}
            >
              {t('MovePopup.Equip')}
            </button>
            <button
              type="button"
              className={clsx('dim-button', { selected: !equipToggled })}
              onClick={setStore}
            >
              {t('MovePopup.Store')}
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const filter = useMemo(() => filters.filterFunction(query), [filters, query]);
  const items = useMemo(() => {
    let items = sortItems(allItems.filter(filter), itemSortOrder);
    if (sortBy) {
      items = _.sortBy(items, sortBy);
    }
    return items;
  }, [allItems, filter, itemSortOrder, sortBy]);

  return (
    <Sheet onClose={onSheetClosedFn} header={header} sheetClassName="item-picker">
      {({ onClose }) => (
        <div className="sub-bucket" ref={itemContainer} style={{ height }}>
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
