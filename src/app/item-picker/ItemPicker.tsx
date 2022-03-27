import ClassIcon from 'app/dim-ui/ClassIcon';
import { t } from 'app/i18next-t';
import Highlights from 'app/item-feed/Highlights';
import { ItemFilter } from 'app/search/filter-types';
import SearchBar from 'app/search/SearchBar';
import { sortItems } from 'app/shell/item-comparators';
import { RootState } from 'app/store/types';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import { BucketHashes } from 'data/d2/generated-enums';
import _ from 'lodash';
import React, { useMemo, useState } from 'react';
import { connect, MapStateToProps } from 'react-redux';
import { createSelector } from 'reselect';
import Sheet from '../dim-ui/Sheet';
import ConnectedInventoryItem from '../inventory/ConnectedInventoryItem';
import { DimItem } from '../inventory/item-types';
import { allItemsSelector } from '../inventory/selectors';
import { filterFactorySelector } from '../search/search-filter';
import { ItemSortSettings, itemSortSettingsSelector } from '../settings/item-sort';
import { ItemPickerState } from './item-picker';
import styles from './ItemPicker.m.scss';
import './ItemPicker.scss';

type ProvidedProps = ItemPickerState & {
  onSheetClosed(): void;
};

interface StoreProps {
  allItems: DimItem[];
  itemSortSettings: ItemSortSettings;
  filters(query: string): ItemFilter;
}

function mapStateToProps(): MapStateToProps<StoreProps, ProvidedProps> {
  const filteredItemsSelector = createSelector(
    allItemsSelector,
    (_state: RootState, ownProps: ProvidedProps) => ownProps.filterItems,
    (allitems, filterItems) => (filterItems ? allitems.filter(filterItems) : allitems)
  );

  return (state, ownProps) => ({
    allItems: filteredItemsSelector(state, ownProps),
    filters: filterFactorySelector(state),
    itemSortSettings: itemSortSettingsSelector(state),
  });
}

type Props = ProvidedProps & StoreProps;

function ItemPicker({
  allItems,
  prompt,
  filters,
  itemSortSettings,
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
    let items = sortItems(allItems.filter(filter), itemSortSettings);
    if (sortBy) {
      items = _.sortBy(items, sortBy);
    }
    if (uniqueBy) {
      items = _.uniqBy(items, uniqueBy);
    }
    return items;
  }, [allItems, filter, itemSortSettings, sortBy, uniqueBy]);

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
        <div className={styles.itemGrid}>
          {items.map((item) => (
            <ItemPickerItem
              key={item.index}
              item={item}
              ignoreSelectedPerks={ignoreSelectedPerks}
              onClick={() => onItemSelectedFn(item, onClose)}
            />
          ))}
        </div>
      )}
    </Sheet>
  );
}

function ItemPickerItem({
  item,
  ignoreSelectedPerks,
  onClick,
}: {
  item: DimItem;
  ignoreSelectedPerks?: boolean;
  onClick(): void;
}) {
  return (
    <div className={styles.itemPickerItem}>
      <ConnectedInventoryItem
        item={item}
        onClick={onClick}
        ignoreSelectedPerks={ignoreSelectedPerks}
      />
      {item.bucket.hash === BucketHashes.Subclass && (
        <ClassIcon classType={item.classType} className={styles.classIcon} />
      )}
      <div className={styles.info}>
        <div className={styles.title}>
          {item.name}
          {item.classType !== DestinyClass.Unknown && (
            <ClassIcon classType={item.classType} className={styles.titleClassIcon} />
          )}
        </div>
        <Highlights item={item} />
      </div>
    </div>
  );
}

export default connect<StoreProps, {}, ProvidedProps>(mapStateToProps)(ItemPicker);
