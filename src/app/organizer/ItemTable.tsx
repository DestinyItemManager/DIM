import { destinyVersionSelector } from 'app/accounts/selectors';
import { customStatsSelector, languageSelector, settingSelector } from 'app/dim-api/selectors';
import useBulkNote from 'app/dim-ui/useBulkNote';
import { t } from 'app/i18next-t';
import { bulkLockItems, bulkTagItems } from 'app/inventory/bulk-actions';
import { DimItem, DimSocket } from 'app/inventory/item-types';
import {
  allItemsSelector,
  createItemContextSelector,
  getNotesSelector,
  getTagSelector,
  newItemsSelector,
  storesSelector,
} from 'app/inventory/selectors';
import { DimStore } from 'app/inventory/store-types';
import {
  applySocketOverrides,
  useSocketOverridesForItems,
} from 'app/inventory/store/override-sockets';
import { applyLoadout } from 'app/loadout-drawer/loadout-apply';
import { convertToLoadoutItem, newLoadout } from 'app/loadout-drawer/loadout-utils';
import { loadoutsByItemSelector } from 'app/loadout/selectors';
import { useD2Definitions } from 'app/manifest/selectors';
import { searchFilterSelector } from 'app/search/items/item-search-filter';
import { setSettingAction } from 'app/settings/actions';
import { toggleSearchQueryComponent } from 'app/shell/actions';
import { AppIcon, faCaretDown, faCaretUp } from 'app/shell/icons';
import { loadingTracker } from 'app/shell/loading-tracker';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import { Comparator, chainComparator, compareBy, reverseComparator } from 'app/utils/comparators';
import { emptyArray } from 'app/utils/empty';
import { useSetCSSVarToHeight, useShiftHeld } from 'app/utils/hooks';
import { LookupTable, StringLookup } from 'app/utils/util-types';
import { hasWishListSelector, wishListFunctionSelector } from 'app/wishlists/selectors';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import { ItemCategoryHashes } from 'data/d2/generated-enums';
import _ from 'lodash';
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { StatInfo, buildStatInfo, getColumnSelectionId, getColumns } from './Columns';
import ItemActions, { TagCommandInfo } from './ItemActions';
import { itemIncludesCategories } from './filtering-utils';

import { compareSelectedItems } from 'app/compare/actions';

import { useTableColumnSorts } from 'app/dim-ui/table-columns';
import { filterMap } from 'app/utils/collections';
import { createPortal } from 'react-dom';

import { DimLanguage } from 'app/i18n';
import { localizedSorter } from 'app/utils/intl';

import UserGuideLink from 'app/dim-ui/UserGuideLink';
import DownloadCSVAction from './DownloadCSVAction';
import EnabledColumnsSelector from './EnabledColumnsSelector';
import ImportCSVAction from './ImportCSVAction';
import ItemListExpander from './ItemListExpander';
import styles from './ItemTable.m.scss'; // eslint-disable-line css-modules/no-unused-class
import { ItemCategoryTreeNode, armorTopLevelCatHashes } from './ItemTypeSelector';
import { ColumnDefinition, ColumnSort, Row, SortDirection } from './table-types';

const possibleStyles = styles as unknown as StringLookup<string>;

const categoryToClass: LookupTable<ItemCategoryHashes, DestinyClass> = {
  [ItemCategoryHashes.Hunter]: DestinyClass.Hunter,
  [ItemCategoryHashes.Titan]: DestinyClass.Titan,
  [ItemCategoryHashes.Warlock]: DestinyClass.Warlock,
};

const MemoRow = memo(TableRow);

const EXPAND_INCREMENT = 20;

export default function ItemTable({ categories }: { categories: ItemCategoryTreeNode[] }) {
  const dispatch = useThunkDispatch();
  const defs = useD2Definitions();

  const firstCategory = categories[1];
  const isWeapon = Boolean(firstCategory?.itemCategoryHash === ItemCategoryHashes.Weapon);
  const isGhost = Boolean(firstCategory?.itemCategoryHash === ItemCategoryHashes.Ghost);
  const isArmor = !isWeapon && !isGhost;
  const itemType = isWeapon ? 'weapon' : isArmor ? 'armor' : 'ghost';

  const enabledColumns = useSelector(settingSelector(columnSetting(itemType)));
  const itemCreationContext = useSelector(createItemContextSelector);
  const allItems = useSelector(allItemsSelector);
  const searchFilter = useSelector(searchFilterSelector);
  const language = useSelector(languageSelector);

  const [columnSorts, toggleColumnSort] = useTableColumnSorts([
    { columnId: 'name', sort: SortDirection.ASC },
  ]);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  // Track the last selection for shift-selecting
  const lastSelectedId = useRef<string | null>(null);
  const [socketOverrides, onPlugClicked] = useSocketOverridesForItems();

  // virtual paging
  const [maxItems, setMaxItems] = useState(EXPAND_INCREMENT);
  useEffect(() => {
    setMaxItems(EXPAND_INCREMENT);
  }, [categories]);
  const expandItems = useCallback(() => setMaxItems((m) => m + EXPAND_INCREMENT), []);

  // Are we at a item category that can show items?
  const terminal = Boolean(categories.at(-1)?.terminal);
  const originalItems = useMemo(() => {
    if (!terminal) {
      return emptyArray<DimItem>();
    }
    const categoryHashes = categories.map((s) => s.itemCategoryHash).filter(Boolean);
    // a top level class-specific category implies armor
    if (armorTopLevelCatHashes.some((h) => categoryHashes.includes(h))) {
      categoryHashes.push(ItemCategoryHashes.Armor);
    }
    const items = allItems.filter(
      (i) => i.comparable && itemIncludesCategories(i, categoryHashes) && searchFilter(i),
    );
    return items;
  }, [allItems, categories, searchFilter, terminal]);

  const classCategoryHash = categories.find(
    (n) => n.itemCategoryHash in categoryToClass,
  )?.itemCategoryHash;
  const classIfAny: DestinyClass = classCategoryHash
    ? (categoryToClass[classCategoryHash] ?? DestinyClass.Unknown)
    : DestinyClass.Unknown;

  // Calculate the true height of the table header, for sticky-ness
  const tableRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (tableRef.current) {
      let height = 0;
      for (const node of tableRef.current.children) {
        if (node.classList.contains(styles.header)) {
          height = Math.max(node.clientHeight, height);
        } else if (height > 0) {
          break;
        }
      }

      document.querySelector('html')!.style.setProperty('--table-header-height', `${height + 1}px`);
    }
  });

  const items = useMemo(
    () =>
      defs
        ? originalItems.map((item) =>
            applySocketOverrides(itemCreationContext, item, socketOverrides[item.id]),
          )
        : originalItems,
    [itemCreationContext, defs, originalItems, socketOverrides],
  );

  // Build a list of all the stats relevant to this set of items
  const statHashes = useMemo(() => buildStatInfo(items), [items]);

  const columns = useColumnDefinitions(itemType, statHashes, onPlugClicked);
  const filteredColumns = useMemo(
    () =>
      _.compact(
        enabledColumns.flatMap((id) =>
          columns.filter(
            (column) =>
              id === getColumnSelectionId(column) &&
              (column.limitToClass === undefined || column.limitToClass === classIfAny),
          ),
        ),
      ),
    [columns, enabledColumns, classIfAny],
  );

  // process items into Rows
  const unsortedRows: Row[] = useMemo(
    () => buildRows(items, filteredColumns),
    [filteredColumns, items],
  );
  const rows = useMemo(
    () => sortRows(unsortedRows, columnSorts, filteredColumns, language),
    [unsortedRows, filteredColumns, columnSorts, language],
  );

  const shiftHeld = useShiftHeld();

  const onChangeEnabledColumn = useCallback(
    ({ checked, id }: { checked: boolean; id: string }) => {
      dispatch(
        setSettingAction(
          columnSetting(itemType),
          Array.from(
            new Set(
              filterMap(columns, (c) => {
                const cId = getColumnSelectionId(c);
                if (cId === id) {
                  return checked ? cId : undefined;
                } else {
                  return enabledColumns.includes(cId) ? cId : undefined;
                }
              }),
            ),
          ),
        ),
      );
    },
    [dispatch, columns, enabledColumns, itemType],
  );

  const selectedItems = items.filter((i) => selectedItemIds.includes(i.id));

  /**
   * Handles Click Events for Table Rows
   * When shift-clicking a value, if there's a filter function defined, narrow/un-narrow the search
   * When ctrl-clicking toggles selected value
   */
  const onRowClick = useCallback(
    (
      row: Row,
      column: ColumnDefinition,
    ): React.MouseEventHandler<HTMLTableCellElement> | undefined =>
      column.filter
        ? (e) => {
            if (e.shiftKey) {
              const node = e.target as HTMLElement;
              const filter = column.filter!(
                node.dataset.filterValue ?? row.values[column.id],
                row.item,
              );
              if (filter !== undefined) {
                dispatch(toggleSearchQueryComponent(filter));
              }
            } else if (e.ctrlKey) {
              setSelectedItemIds(
                selectedItemIds.findIndex((selectedItemId) => selectedItemId === row.item.id) === -1
                  ? [...selectedItemIds, row.item.id]
                  : selectedItemIds.filter((id) => id !== row.item.id),
              );
            }
          }
        : undefined,
    [dispatch, selectedItemIds],
  );

  const gridSpec = `min-content ${filteredColumns
    .map((c) => c.gridWidth ?? 'min-content')
    .join(' ')}`;

  const numColumns = filteredColumns.length + 1;

  const rowStyle = [...Array(numColumns).keys()]
    .map(
      (_v, n) =>
        `[role="cell"]:nth-of-type(${numColumns * 2}n+${
          n + 2
        }){background-color:var(--theme-organizer-row-even-bg) !important;}`,
    )
    .join('\n');

  /**
   * Select all items, or if any are selected, clear the selection.
   */
  const selectAllItems: React.ChangeEventHandler<HTMLInputElement> = () => {
    if (selectedItems.length === 0) {
      setSelectedItemIds(rows.map((r) => r.item.id));
    } else {
      setSelectedItemIds([]);
    }
  };

  /**
   * Select and unselect items. Supports shift-held range selection.
   */
  const selectItem = (e: React.ChangeEvent<HTMLInputElement>, item: DimItem) => {
    let changingIds = [item.id];
    if (shiftHeld && lastSelectedId.current) {
      let startIndex = rows.findIndex((r) => r.item.id === lastSelectedId.current);
      let endIndex = rows.findIndex((r) => r.item === item);
      if (startIndex > endIndex) {
        const tmp = startIndex;
        startIndex = endIndex;
        endIndex = tmp;
      }
      changingIds = rows.slice(startIndex, endIndex + 1).map((r) => r.item.id);
    }

    if (e.target.checked) {
      setSelectedItemIds((selected) => [...new Set([...selected, ...changingIds])]);
    } else {
      setSelectedItemIds((selected) => selected.filter((i) => !changingIds.includes(i)));
    }

    lastSelectedId.current = item.id;
  };

  return (
    <>
      <div
        className={clsx(styles.table, shiftHeld && styles.shiftHeld)}
        style={{ gridTemplateColumns: gridSpec }}
        role="table"
        ref={tableRef}
      >
        {createPortal(<style>{rowStyle}</style>, document.head)}
        <ItemTableToolbar selectedItems={selectedItems}>
          <UserGuideLink topic="Organizer" />
          <ImportCSVAction className={styles.importButton} />
          <DownloadCSVAction firstCategory={firstCategory} className={styles.importButton} />
          <EnabledColumnsSelector
            columns={columns}
            enabledColumns={enabledColumns}
            onChangeEnabledColumn={onChangeEnabledColumn}
            forClass={classIfAny}
          />
        </ItemTableToolbar>
        <div className={clsx(styles.selection, styles.header)} role="columnheader" aria-sort="none">
          <div>
            <input
              name="selectAll"
              title={t('Organizer.SelectAll')}
              type="checkbox"
              checked={selectedItems.length === rows.length}
              ref={(el) =>
                el &&
                (el.indeterminate =
                  selectedItems.length !== rows.length && selectedItems.length > 0)
              }
              onChange={selectAllItems}
            />
          </div>
        </div>
        {filteredColumns.map((column) => {
          const isStatsColumn = ['stats', 'baseStats'].includes(column.columnGroup?.id ?? '');
          return (
            <div
              key={column.id}
              className={clsx(
                possibleStyles[column.id],
                column.id.startsWith('customstat_') && styles.customstat,
                styles.header,
                {
                  [styles.stats]: isStatsColumn,
                },
              )}
              role="columnheader"
              aria-sort="none"
            >
              <div
                onClick={
                  column.noSort
                    ? undefined
                    : toggleColumnSort(column.id, shiftHeld, column.defaultSort)
                }
              >
                {column.header}
                {!column.noSort && columnSorts.some((c) => c.columnId === column.id) && (
                  <AppIcon
                    className={styles.sorter}
                    icon={
                      columnSorts.find((c) => c.columnId === column.id)!.sort === SortDirection.DESC
                        ? faCaretDown
                        : faCaretUp
                    }
                  />
                )}
              </div>
            </div>
          );
        })}
        {rows.length === 0 && <div className={styles.noItems}>{t('Organizer.NoItems')}</div>}
        {rows.slice(0, maxItems).map((row) => (
          <React.Fragment key={row.item.id}>
            <div className={styles.selection} role="cell">
              <input
                type="checkbox"
                title={t('Organizer.SelectItem', { name: row.item.name })}
                checked={selectedItemIds.includes(row.item.id)}
                onChange={(e) => selectItem(e, row.item)}
              />
            </div>
            <MemoRow row={row} filteredColumns={filteredColumns} onRowClick={onRowClick} />
          </React.Fragment>
        ))}
      </div>
      {rows.length > maxItems && <ItemListExpander onExpand={expandItems} />}
    </>
  );
}

/**
 * Build a list of rows with materialized values.
 */
function buildRows(items: DimItem[], filteredColumns: ColumnDefinition[]) {
  const unsortedRows: Row[] = items.map((item) => ({
    item,
    values: filteredColumns.reduce<Row['values']>((memo, col) => {
      memo[col.id] = col.value(item);
      return memo;
    }, {}),
  }));
  return unsortedRows;
}

/**
 * Sort the rows based on the selected columns.
 */
function sortRows(
  unsortedRows: Row[],
  columnSorts: ColumnSort[],
  filteredColumns: ColumnDefinition[],
  language: DimLanguage,
) {
  const comparator = chainComparator<Row>(
    ...columnSorts.map((sorter) => {
      const column = filteredColumns.find((c) => c.id === sorter.columnId);
      if (column) {
        const sort = column.sort;
        const compare: Comparator<Row> = sort
          ? (row1, row2) => sort(row1.values[column.id], row2.values[column.id])
          : unsortedRows.some((row) => typeof row.values[column.id] === 'string')
            ? localizedSorter(language, (row) => (row.values[column.id] ?? '') as string)
            : compareBy((row) => row.values[column.id] ?? 0);
        // Always sort undefined values to the end
        return chainComparator(
          compareBy((row) => row.values[column.id] === undefined),
          sorter.sort === SortDirection.ASC ? compare : reverseComparator(compare),
        );
      }
      return compareBy(() => 0);
    }),
  );

  return unsortedRows.toSorted(comparator);
}

function TableRow({
  row,
  filteredColumns,
  onRowClick,
}: {
  row: Row;
  filteredColumns: ColumnDefinition[];
  onRowClick: (
    row: Row,
    column: ColumnDefinition,
  ) => ((event: React.MouseEvent<HTMLTableCellElement>) => void) | undefined;
}) {
  return (
    <>
      {filteredColumns.map((column: ColumnDefinition) => (
        // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
        <div
          key={column.id}
          onClick={onRowClick(row, column)}
          className={clsx(possibleStyles[column.id], {
            [styles.hasFilter]: column.filter !== undefined,
            [styles.customstat]: column.id.startsWith('customstat_'),
          })}
          role="cell"
        >
          {column.cell ? column.cell(row.values[column.id], row.item) : row.values[column.id]}
        </div>
      ))}
    </>
  );
}

function columnSetting(itemType: 'weapon' | 'armor' | 'ghost') {
  switch (itemType) {
    case 'weapon':
      return 'organizerColumnsWeapons';
    case 'armor':
      return 'organizerColumnsArmor';
    case 'ghost':
      return 'organizerColumnsGhost';
  }
}

function useColumnDefinitions(
  itemType: 'weapon' | 'armor' | 'ghost',
  statHashes: {
    [statHash: number]: StatInfo;
  },
  onPlugClicked?: (value: { item: DimItem; socket: DimSocket; plugHash: number }) => void,
) {
  const getTag = useSelector(getTagSelector);
  const getNotes = useSelector(getNotesSelector);
  const wishList = useSelector(wishListFunctionSelector);
  const hasWishList = useSelector(hasWishListSelector);
  const loadoutsByItem = useSelector(loadoutsByItemSelector);
  const newItems = useSelector(newItemsSelector);
  const destinyVersion = useSelector(destinyVersionSelector);
  const customStats = useSelector(customStatsSelector);

  return useMemo(
    () =>
      getColumns(
        'organizer',
        itemType,
        statHashes,
        getTag,
        getNotes,
        wishList,
        hasWishList,
        customStats,
        loadoutsByItem,
        newItems,
        destinyVersion,
        onPlugClicked,
      ),
    [
      wishList,
      hasWishList,
      statHashes,
      itemType,
      getTag,
      getNotes,
      customStats,
      loadoutsByItem,
      newItems,
      destinyVersion,
      onPlugClicked,
    ],
  );
}

function ItemTableToolbar({
  selectedItems,
  children,
}: {
  selectedItems: DimItem[];
  children?: React.ReactNode;
}) {
  const dispatch = useThunkDispatch();
  const stores = useSelector(storesSelector);

  const toolbarRef = useRef(null);
  useSetCSSVarToHeight(toolbarRef, '--item-table-toolbar-height');

  const onLock = loadingTracker.trackPromise(async (lock: boolean) => {
    dispatch(bulkLockItems(selectedItems, lock));
  });

  const [bulkNoteDialog, bulkNote] = useBulkNote();
  const onNote = () => bulkNote(selectedItems);

  const onMoveSelectedItems = useCallback(
    (store: DimStore) => {
      if (selectedItems.length) {
        const loadout = newLoadout(
          t('Organizer.BulkMoveLoadoutName'),
          selectedItems.map((i) => convertToLoadoutItem(i, false)),
        );

        dispatch(applyLoadout(store, loadout, { allowUndo: true }));
      }
    },
    [dispatch, selectedItems],
  );

  const onTagSelectedItems = useCallback(
    (tagInfo: TagCommandInfo) => {
      if (tagInfo.type && selectedItems.length) {
        dispatch(bulkTagItems(selectedItems, tagInfo.type, true));
      }
    },
    [dispatch, selectedItems],
  );

  const onCompareSelectedItems = useCallback(() => {
    if (selectedItems.length) {
      dispatch(compareSelectedItems(selectedItems));
    }
  }, [dispatch, selectedItems]);

  return (
    <div className={styles.toolbar} ref={toolbarRef}>
      {bulkNoteDialog}
      <ItemActions
        itemsAreSelected={selectedItems.length > 0}
        onLock={onLock}
        onNote={onNote}
        stores={stores}
        onTagSelectedItems={onTagSelectedItems}
        onMoveSelectedItems={onMoveSelectedItems}
        onCompareSelectedItems={onCompareSelectedItems}
      />
      {children}
    </div>
  );
}
