/* eslint-disable react/jsx-key, react/prop-types, react-hooks/rules-of-hooks */
import React, { useMemo, useState } from 'react';
import { DimItem } from 'app/inventory/item-types';
import {
  useTable,
  Column,
  useSortBy,
  ColumnInstance,
  UseSortByColumnProps,
  useRowSelect,
  Row,
  TableInstance,
  UseRowSelectInstanceProps,
  UseSortByColumnOptions,
  Cell
} from 'react-table';
import { AppIcon } from 'app/shell/icons';
import styles from './ItemTable.m.scss';
import { SelectionTreeNode } from './ItemTypeSelector';
import _ from 'lodash';
import { DimItemInfo, TagInfo } from 'app/inventory/dim-item-info';
import { ratingsSelector } from 'app/item-review/reducer';
import { DtrRating } from 'app/item-review/dtr-api-types';
import { InventoryWishListRoll } from 'app/wishlists/wishlists';
import { faCaretUp, faCaretDown } from '@fortawesome/free-solid-svg-icons';
import { loadingTracker } from 'app/shell/loading-tracker';
import { setItemState as d1SetItemState } from '../bungie-api/destiny1-api';
import { setLockState as d2SetLockState } from '../bungie-api/destiny2-api';
import { showNotification } from 'app/notifications/notifications';
import { t } from 'app/i18next-t';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import ItemActions from './ItemActions';
import { DimStore } from 'app/inventory/store-types';
import EnabledColumnsSelector, { ColumnStatus } from './EnabledColumnsSelector';
import { bulkTagItems } from 'app/inventory/tag-items';
import { DestinyAccount } from 'app/accounts/destiny-account';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import { RootState } from 'app/store/reducers';
import { storesSelector } from 'app/inventory/reducer';
import { searchFilterSelector } from 'app/search/search-filters';
import { inventoryWishListsSelector } from 'app/wishlists/reducer';
import { toggleSearchQueryComponent } from 'app/shell/actions';
import clsx from 'clsx';
import { useShiftHeld } from 'app/utils/hooks';
import { currentAccountSelector } from 'app/accounts/reducer';
import { newLoadout } from 'app/loadout/loadout-utils';
import { applyLoadout } from 'app/loadout/loadout-apply';
import { LoadoutClass } from 'app/loadout/loadout-types';
import getColumns from './Columns';

const initialState = {
  sortBy: [{ id: 'name' }]
};

const getRowID = (item: DimItem) => item.id;

interface ProvidedProps {
  selection: SelectionTreeNode[];
}

interface StoreProps {
  account?: DestinyAccount;
  stores: DimStore[];
  items: DimItem[];
  defs: D2ManifestDefinitions;
  itemInfos: { [key: string]: DimItemInfo };
  ratings: { [key: string]: DtrRating };
  wishList: {
    [key: string]: InventoryWishListRoll;
  };
  isPhonePortrait: boolean;
}

const mapDispatchToProps = {
  toggleSearchQueryComponent
};
type DispatchProps = typeof mapDispatchToProps;

function mapStateToProps() {
  const allItemsSelector = createSelector(storesSelector, (stores) =>
    stores.flatMap((s) => s.items).filter((i) => i.comparable && i.primStat)
  );
  // TODO: make the table a subcomponent so it can take the subtype as an argument?
  return (state: RootState): StoreProps => {
    const searchFilter = searchFilterSelector(state);
    return {
      account: currentAccountSelector(state),
      items: allItemsSelector(state).filter(searchFilter),
      defs: state.manifest.d2Manifest!,
      stores: storesSelector(state),
      itemInfos: state.inventory.itemInfos,
      ratings: ratingsSelector(state),
      wishList: inventoryWishListsSelector(state),
      isPhonePortrait: state.shell.isPhonePortrait
    };
  };
}

type Props = ProvidedProps & StoreProps & DispatchProps;

interface DimColumnExtras {
  /** An optional filter expression that would limit results to those matching this item. */
  filter?(item: DimItem): string;
}

/** The type of our react-table columns */
export type DimColumn = Column<DimItem> & UseSortByColumnOptions<DimItem> & DimColumnExtras;
type DimColumnInstance = ColumnInstance<DimItem> & UseSortByColumnProps<DimItem> & DimColumnExtras;
type DimCell = Cell<DimItem> & {
  column: DimColumnInstance;
};

const initialEnabledColumns = [
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
];

function ItemTable({
  items,
  selection,
  itemInfos,
  ratings,
  wishList,
  defs,
  stores,
  account,
  toggleSearchQueryComponent
}: Props) {
  // TODO: Indicate equipped/owner? Not sure it's necessary.
  // TODO: maybe implement my own table component

  const terminal = Boolean(_.last(selection)?.terminal);
  items = useMemo(() => {
    const categoryHashes = selection.map((s) => s.itemCategoryHash).filter((h) => h > 0);
    return terminal
      ? items.filter((item) => categoryHashes.every((h) => item.itemCategoryHashes.includes(h)))
      : [];
  }, [items, terminal, selection]);

  const shiftHeld = useShiftHeld();

  const columnsMap = getColumns(itemInfos, ratings, wishList, defs, items);

  // Column id should never be null by this point
  const enabledColumnsInitial: ColumnStatus[] = [];

  for (const { id, Header } of columnsMap.values()) {
    if (id && id !== 'selection') {
      const content = _.isFunction(Header) ? Header({} as any) : Header;
      enabledColumnsInitial.push({ id, content, enabled: initialEnabledColumns.includes(id) });
    }
  }

  const [enabledColumns, setEnabledColumns] = useState(enabledColumnsInitial);

  const sortedEnabledColumns: DimColumn[] = [];
  for (const { id, enabled } of enabledColumns) {
    const col = columnsMap.get(id);
    if (col) {
      col.show = enabled;
      sortedEnabledColumns.push(col);
    }
  }

  // Use the state and functions returned from useTable to build your UI
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
    selectedFlatRows
  } = useTable(
    {
      columns: sortedEnabledColumns,
      data: items,
      initialState,
      getRowID,
      // TODO: probably should reset on query changes too?
      getResetSelectedRowPathsDeps: () => [selection]
    } as any,
    useSortBy,
    useRowSelect
  ) as TableInstance<DimItem> & UseRowSelectInstanceProps<DimItem>;

  if (!terminal) {
    return <div>No items match the current filters.</div>;
  }

  const onChangeEnabledColumn: (item: ColumnStatus) => void = (item) => {
    const { enabled, id } = item;
    const newEnabledColumns = [...enabledColumns];
    for (const column of newEnabledColumns) {
      if (column.id === id) {
        column.enabled = !enabled;
      }
    }
    console.log('change enabled clicked');
    setEnabledColumns(newEnabledColumns);
  };

  const onChangeColumnOrder: (newEnabledColumns: ColumnStatus[]) => void = (newEnabledColumns) => {
    console.log('change order clicked');
    setEnabledColumns(newEnabledColumns);
  };

  // TODO: stolen from SearchFilter, should probably refactor into a shared thing
  const onLock = loadingTracker.trackPromise(async (e) => {
    const selectedTag = e.currentTarget.name;
    const items = selectedFlatRows?.map((d) => d.original);

    const state = selectedTag === 'lock';
    try {
      for (const item of items) {
        const store =
          item.owner === 'vault'
            ? item.getStoresService().getActiveStore()!
            : item.getStoresService().getStore(item.owner)!;

        if (item.isDestiny2()) {
          await d2SetLockState(store, item, state);
        } else if (item.isDestiny1()) {
          await d1SetItemState(item, store, state, 'lock');
        }

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
    row: Row<DimItem>,
    cell: DimCell
  ): React.MouseEventHandler<HTMLTableDataCellElement> | undefined =>
    cell.column.filter
      ? (e) => {
          if (e.shiftKey) {
            const filter = cell.column.filter!(row.original);
            if (filter !== undefined) {
              toggleSearchQueryComponent(filter);
            }
          }
        }
      : undefined;

  const onMoveSelectedItems = (store: DimStore) => {
    if (selectedFlatRows?.length) {
      const items = selectedFlatRows?.map((d) => d.original);
      const loadoutItems: { [type: string]: DimItem[] } = {};

      for (const item of items) {
        if (!loadoutItems[item.type]) {
          loadoutItems[item.type] = [];
        }
        loadoutItems[item.type].push(item);
      }

      const loadout = newLoadout(t('Organizer.BulkMoveLoadoutName'), loadoutItems);
      if (store.class !== 'vault') {
        loadout.classType = LoadoutClass[store.class];
      }

      applyLoadout(store, loadout, true);
    }
  };

  const onTagSelectedItems = (tagInfo: TagInfo) => {
    if (tagInfo.type && selectedFlatRows?.length) {
      const items = selectedFlatRows.map((d) => d.original);
      bulkTagItems(account, items, tagInfo.type);
    }
  };

  return (
    <>
      <EnabledColumnsSelector
        enabledColumns={enabledColumns}
        onChangeEnabledColumn={onChangeEnabledColumn}
        onChangeColumnOrder={onChangeColumnOrder}
      />
      <ItemActions
        itemsAreSelected={Boolean(selectedFlatRows.length)}
        onLock={onLock}
        stores={stores}
        onTagSelectedItems={onTagSelectedItems}
        onMoveSelectedItems={onMoveSelectedItems}
      />
      <div className={clsx(styles.tableContainer, shiftHeld && styles.shiftHeld)}>
        <table className={styles.table} {...getTableProps()}>
          <thead>
            {headerGroups.map((headerGroup) => (
              <tr {...headerGroup.getHeaderGroupProps()}>
                {headerGroup.headers.map((column: DimColumnInstance) => (
                  <th
                    {...column.getHeaderProps(column.getSortByToggleProps())}
                    className={styles[column.id]}
                  >
                    {column.render('Header')}
                    {column.isSorted && (
                      <AppIcon icon={column.isSortedDesc ? faCaretUp : faCaretDown} />
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody {...getTableBodyProps()}>
            {rows.map((row) => {
              prepareRow(row);
              return (
                <tr {...row.getRowProps()}>
                  {row.cells.map((cell: DimCell) => (
                    <td
                      {...cell.getCellProps()}
                      onClick={narrowQueryFunction(row, cell)}
                      className={clsx(
                        styles[cell.column.id],
                        cell.column.filter && styles.hasFilter
                      )}
                    >
                      {cell.render('Cell')}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default connect<StoreProps, DispatchProps>(mapStateToProps, mapDispatchToProps)(ItemTable);
