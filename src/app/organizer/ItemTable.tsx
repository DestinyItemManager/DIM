/* eslint-disable react/jsx-key, react/prop-types */
import React, { useMemo, useState } from 'react';
import { DimItem } from 'app/inventory/item-types';
import { AppIcon, faCaretUp, faCaretDown } from 'app/shell/icons';
import styles from './ItemTable.m.scss';
import { ItemCategoryTreeNode } from './ItemTypeSelector';
import _ from 'lodash';
import { ItemInfos, TagInfo } from 'app/inventory/dim-item-info';
import { DtrRating } from 'app/item-review/dtr-api-types';
import { InventoryWishListRoll } from 'app/wishlists/wishlists';
import { loadingTracker } from 'app/shell/loading-tracker';
import { showNotification } from 'app/notifications/notifications';
import { t } from 'app/i18next-t';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import ItemActions from './ItemActions';
import { DimStore } from 'app/inventory/store-types';
import EnabledColumnsSelector from './EnabledColumnsSelector';
import { bulkTagItems } from 'app/inventory/tag-items';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import { RootState, ThunkDispatchProp } from 'app/store/reducers';
import { storesSelector, itemInfosSelector } from 'app/inventory/selectors';
import { searchFilterSelector } from 'app/search/search-filters';
import { inventoryWishListsSelector } from 'app/wishlists/reducer';
import { toggleSearchQueryComponent } from 'app/shell/actions';
import clsx from 'clsx';
import { useShiftHeld } from 'app/utils/hooks';
import { newLoadout, convertToLoadoutItem } from 'app/loadout/loadout-utils';
import { applyLoadout } from 'app/loadout/loadout-apply';
import { getColumns } from './Columns';
import { ratingsSelector } from 'app/item-review/reducer';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import { setItemLockState } from 'app/inventory/item-move-service';
import { emptyObject } from 'app/utils/empty';
import { Row, ColumnDefinition, SortDirection, ColumnSort } from './table-types';
import { compareBy, chainComparator, reverseComparator } from 'app/utils/comparators';

const categoryToClass = {
  23: DestinyClass.Hunter,
  22: DestinyClass.Titan,
  21: DestinyClass.Warlock
};

interface ProvidedProps {
  categories: ItemCategoryTreeNode[];
}

interface StoreProps {
  stores: DimStore[];
  items: DimItem[];
  defs: D2ManifestDefinitions;
  itemInfos: ItemInfos;
  ratings: { [key: string]: DtrRating };
  wishList: {
    [key: string]: InventoryWishListRoll;
  };
  isPhonePortrait: boolean;
}

function mapStateToProps() {
  const allItemsSelector = createSelector(storesSelector, (stores) =>
    stores.flatMap((s) => s.items).filter((i) => i.comparable && i.primStat)
  );
  // TODO: make the table a subcomponent so it can take the subtype as an argument?
  return (state: RootState): StoreProps => {
    const searchFilter = searchFilterSelector(state);
    return {
      items: allItemsSelector(state).filter(searchFilter),
      defs: state.manifest.d2Manifest!,
      stores: storesSelector(state),
      itemInfos: itemInfosSelector(state),
      ratings: $featureFlags.reviewsEnabled ? ratingsSelector(state) : emptyObject(),
      wishList: inventoryWishListsSelector(state),
      isPhonePortrait: state.shell.isPhonePortrait
    };
  };
}

type Props = ProvidedProps & StoreProps & ThunkDispatchProp;

// Functions:
// Sort
// Select/multiselect
// shift-click filtering
// get selected items
// cell display
// table width
// enabled columns?

// TODO: drop wishlist columns if no wishlist loaded
// TODO: d1/d2 columns
// TODO: stat ranges
// TODO: special stat display? recoil, bars, etc

function ItemTable({
  items,
  categories,
  itemInfos,
  ratings,
  wishList,
  defs,
  stores,
  dispatch
}: Props) {
  // TODO: Indicate equipped/owner? Not sure it's necessary.
  // TODO: maybe implement my own table component

  // TODO: useDispatch
  // TODO: different for weapons and armor?
  const [columnSorts, setColumnSorts] = useState<ColumnSort[]>([
    { columnId: 'name', sort: SortDirection.ASC }
  ]);
  //const [selection, setSelection] = useState<string[]>([]);
  // Track the last selection for shift-selecting
  //const lastSelectedIndex = useRef<number>(null);

  // Narrow items to selection
  const terminal = Boolean(_.last(categories)?.terminal);
  items = useMemo(() => {
    const categoryHashes = categories.map((s) => s.itemCategoryHash).filter((h) => h > 0);
    return terminal
      ? items.filter((item) => categoryHashes.every((h) => item.itemCategoryHashes.includes(h)))
      : [];
  }, [items, terminal, categories]);

  // TODO: save in settings
  // TODO: separate settings for armor & weapons?
  // TODO: reorder
  const [enabledColumns, setEnabledColumns] = useState([
    'selection',
    'icon',
    'name',
    'dmg',
    'power',
    'locked',
    'tag',
    'wishList',
    'rating',
    'archetype',
    'perks',
    'mods',
    'notes'
  ]);

  // TODO: hide columns if all undefined

  // TODO: trim columns based on enabledColumns
  // TODO: really gotta pass these in... need to figure out data dependencies
  // https://github.com/tannerlinsley/react-table/blob/master/docs/api.md
  const columns: ColumnDefinition[] = useMemo(
    () => getColumns(items, defs, itemInfos, ratings, wishList),
    [wishList, items, itemInfos, ratings, defs]
  );

  // TODO: "Stats" as a column
  const filteredColumns = _.compact(
    enabledColumns.map((id) => columns.find((column) => column.id === id))
  );

  // process items into Rows
  const rows: Row[] = useMemo(() => {
    const unsortedRows: Row[] = items.map((item) => ({
      item,
      values: filteredColumns.reduce((memo, col) => {
        memo[col.id] = col.value(item);
        return memo;
      }, {})
    }));

    // TODO: sort
    const comparator = chainComparator<Row>(
      ...columnSorts.map((sorter) => {
        const column = filteredColumns.find((c) => c.id === sorter.columnId);
        if (column) {
          const compare = column.sort
            ? (row1: Row, row2: Row) => column.sort!(row1.values[column.id], row2.values[column.id])
            : compareBy((row: Row) => row.values[column.id]);
          return sorter.sort === SortDirection.ASC ? compare : reverseComparator(compare);
        }
        return compareBy(() => 0);
      })
    );

    return unsortedRows.sort(comparator);
  }, [filteredColumns, items, columnSorts]);

  // sort rows
  // render

  const classCategoryHash =
    categories.map((n) => n.itemCategoryHash).find((hash) => hash in categoryToClass) ?? 999;
  const classIfAny = categoryToClass[classCategoryHash]! ?? DestinyClass.Unknown;

  const shiftHeld = useShiftHeld();

  // TODO inefficient
  const selectedFlatRows: DimItem[] = []; //selection.map((s) => items.find((i) => s === i.id)!);

  if (!terminal) {
    return <div>No items match the current filters.</div>;
  }

  const onChangeEnabledColumn: (item: { checked: boolean; id: string }) => void = (item) => {
    const { checked, id } = item;
    setEnabledColumns((columns) => (checked ? [...columns, id] : columns.filter((c) => c !== id)));
  };

  // TODO: stolen from SearchFilter, should probably refactor into a shared thing
  const onLock = loadingTracker.trackPromise(async (e) => {
    const selectedTag = e.currentTarget.name;
    const items = selectedFlatRows;

    const state = selectedTag === 'lock';
    try {
      for (const item of items) {
        await setItemLockState(item, state);

        // TODO: Gotta do this differently in react land
        item.locked = state;
      }
      showNotification({
        type: 'success',
        title: state
          ? t('Filter.LockAllSuccess', { num: items.length })
          : t('Filter.UnlockAllSuccess', { num: items.length })
      });
    } catch (e) {
      showNotification({
        type: 'error',
        title: state ? t('Filter.LockAllFailed') : t('Filter.UnlockAllFailed'),
        body: e.message
      });
    } finally {
      // Touch the stores service to update state
      if (items.length) {
        items[0].getStoresService().touch();
      }
    }
  });

  /**
   * When shift-clicking a value, if there's a filter function defined, narrow/un-narrow the search
   */
  const narrowQueryFunction = (
    row: Row,
    column: ColumnDefinition
  ): React.MouseEventHandler<HTMLTableDataCellElement> | undefined =>
    column.filter
      ? (e) => {
          if (e.shiftKey) {
            const filter = column.filter!(row.values[column.id], row.item);
            if (filter !== undefined) {
              dispatch(toggleSearchQueryComponent(filter));
            }
          }
        }
      : undefined;

  const onMoveSelectedItems = (store: DimStore) => {
    if (selectedFlatRows?.length) {
      const items = selectedFlatRows;
      const loadoutItems: DimItem[] = [];

      for (const item of items) {
        if (!loadoutItems[item.type]) {
          loadoutItems[item.type] = [];
        }
        loadoutItems[item.type].push(item);
      }

      const loadout = newLoadout(
        t('Organizer.BulkMoveLoadoutName'),
        items.map((i) => convertToLoadoutItem(i, false))
      );

      applyLoadout(store, loadout, true);
    }
  };

  const onTagSelectedItems = (tagInfo: TagInfo) => {
    if (tagInfo.type && selectedFlatRows?.length) {
      const items = selectedFlatRows;
      dispatch(bulkTagItems(items, tagInfo.type));
    }
  };

  const gridSpec = `min-content ${filteredColumns
    .map((c) => c.gridWidth ?? 'min-content')
    .join(' ')}`;

  // TODO: this is garbage
  // TODO: useReducer
  // TODO: replace on click, append on shift-click
  const toggleColumnSort = (column: ColumnDefinition) => () => {
    const existingSort = columnSorts.find((c) => c.columnId === column.id);
    if (existingSort) {
      console.log(
        existingSort.sort,
        existingSort.sort === SortDirection.ASC ? SortDirection.DESC : SortDirection.ASC
      );
      setColumnSorts([
        {
          columnId: column.id,
          sort: existingSort.sort === SortDirection.ASC ? SortDirection.DESC : SortDirection.ASC
        }
      ]);
    } else {
      console.log('no existing sort', columnSorts, column.id);
      setColumnSorts([{ columnId: column.id, sort: column.defaultSort || SortDirection.ASC }]);
    }
  };

  // TODO: css grid, floating header
  return (
    <>
      <EnabledColumnsSelector
        columns={columns.filter((c) => c.id !== 'selection')}
        enabledColumns={enabledColumns}
        onChangeEnabledColumn={onChangeEnabledColumn}
        forClass={classIfAny}
      />
      <ItemActions
        itemsAreSelected={Boolean(selectedFlatRows.length)}
        onLock={onLock}
        stores={stores}
        onTagSelectedItems={onTagSelectedItems}
        onMoveSelectedItems={onMoveSelectedItems}
      />
      <div
        className={clsx(styles.table, shiftHeld && styles.shiftHeld)}
        style={{ gridTemplateColumns: gridSpec }}
        role="table"
      >
        <div className={clsx(styles.selection, styles.header)} role="columnheader" aria-sort="none">
          <input type="checkbox" />
        </div>
        {filteredColumns.map((column: ColumnDefinition) => (
          <div
            key={column.id}
            className={clsx(styles[column.id], styles.header)}
            role="columnheader"
            aria-sort="none"
          >
            <div onClick={column.noSort ? undefined : toggleColumnSort(column)}>
              {!column.noSort && columnSorts.some((c) => c.columnId === column.id) && (
                <AppIcon
                  icon={
                    columnSorts.find((c) => c.columnId === column.id)!.sort === SortDirection.DESC
                      ? faCaretUp
                      : faCaretDown
                  }
                />
              )}
              {column.Header}
            </div>
          </div>
        ))}
        {rows.map((row, i) => (
          // TODO: row component
          <React.Fragment key={row.item.id}>
            <div
              className={clsx(styles.selection, {
                [styles.alternateRow]: i % 2
              })}
              role="cell"
            >
              <input type="checkbox" />
            </div>
            {filteredColumns.map((column: ColumnDefinition) => (
              <div
                key={column.id}
                onClick={narrowQueryFunction(row, column)}
                className={clsx(styles[column.id], column.filter && styles.hasFilter, {
                  [styles.alternateRow]: i % 2
                })}
                role="cell"
              >
                {column.Cell ? column.Cell(row.values[column.id], row.item) : row.values[column.id]}
              </div>
            ))}
          </React.Fragment>
        ))}
      </div>
    </>
  );
}

export default connect<StoreProps>(mapStateToProps)(ItemTable);
