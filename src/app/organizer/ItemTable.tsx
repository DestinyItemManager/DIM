import { destinyVersionSelector } from 'app/accounts/selectors';
import { languageSelector, settingSelector } from 'app/dim-api/selectors';
import UserGuideLink from 'app/dim-ui/UserGuideLink';
import useBulkNote from 'app/dim-ui/useBulkNote';
import useConfirm from 'app/dim-ui/useConfirm';
import { t, tl } from 'app/i18next-t';
import { bulkLockItems, bulkTagItems } from 'app/inventory/bulk-actions';
import { DimItem, DimStat } from 'app/inventory/item-types';
import {
  allItemsSelector,
  createItemContextSelector,
  getNotesSelector,
  getTagSelector,
  newItemsSelector,
  storesSelector,
} from 'app/inventory/selectors';
import { downloadCsvFiles, importTagsNotesFromCsv } from 'app/inventory/spreadsheets';
import { DimStore } from 'app/inventory/store-types';
import {
  applySocketOverrides,
  useSocketOverridesForItems,
} from 'app/inventory/store/override-sockets';
import { applyLoadout } from 'app/loadout-drawer/loadout-apply';
import { convertToLoadoutItem, newLoadout } from 'app/loadout-drawer/loadout-utils';
import { loadoutsByItemSelector } from 'app/loadout/selectors';
import { useD2Definitions } from 'app/manifest/selectors';
import { showNotification } from 'app/notifications/notifications';
import { searchFilterSelector } from 'app/search/items/item-search-filter';
import { setSettingAction } from 'app/settings/actions';
import { toggleSearchQueryComponent } from 'app/shell/actions';
import { AppIcon, faCaretDown, faCaretUp, spreadsheetIcon, uploadIcon } from 'app/shell/icons';
import { loadingTracker } from 'app/shell/loading-tracker';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import { Comparator, chainComparator, compareBy, reverseComparator } from 'app/utils/comparators';
import { emptyArray } from 'app/utils/empty';
import { useSetCSSVarToHeight, useShiftHeld } from 'app/utils/hooks';
import { LookupTable } from 'app/utils/util-types';
import { hasWishListSelector, wishListFunctionSelector } from 'app/wishlists/selectors';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import { ItemCategoryHashes } from 'data/d2/generated-enums';
import React, { ReactNode, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Dropzone, { DropzoneOptions } from 'react-dropzone';
import { useSelector } from 'react-redux';
import { buildStatInfo, getColumnSelectionId, getColumns } from './Columns';
import EnabledColumnsSelector from './EnabledColumnsSelector';
import ItemActions, { TagCommandInfo } from './ItemActions';

import { compareSelectedItems } from 'app/compare/actions';

import { useTableColumnSorts } from 'app/dim-ui/table-columns';
import { compact, filterMap } from 'app/utils/collections';
import { errorMessage } from 'app/utils/errors';

import { DimLanguage } from 'app/i18n';
import { localizedSorter } from 'app/utils/intl';

import * as styles from './ItemTable.m.scss';
import { ItemCategoryTreeNode, armorTopLevelCatHashes } from './ItemTypeSelector';
import { ColumnDefinition, ColumnSort, Row, SortDirection, TableContext } from './table-types';

const categoryToClass: LookupTable<ItemCategoryHashes, DestinyClass> = {
  [ItemCategoryHashes.Hunter]: DestinyClass.Hunter,
  [ItemCategoryHashes.Titan]: DestinyClass.Titan,
  [ItemCategoryHashes.Warlock]: DestinyClass.Warlock,
};

const downloadButtonSettings = [
  { categoryId: ['weapons'], csvType: 'weapon' as const, label: tl('Bucket.Weapons') },
  {
    categoryId: ['hunter', 'titan', 'warlock'],
    csvType: 'armor' as const,
    label: tl('Bucket.Armor'),
  },
  { categoryId: ['ghosts'], csvType: 'ghost' as const, label: tl('Bucket.Ghost') },
];

export const MemoRow = memo(TableRow);

const EXPAND_INCREMENT = 20;

export default function ItemTable({ categories }: { categories: ItemCategoryTreeNode[] }) {
  const [columnSorts, toggleColumnSort] = useTableColumnSorts([
    { columnId: 'name', sort: SortDirection.ASC },
  ]);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  // Track the last selection for shift-selecting
  const lastSelectedId = useRef<string | null>(null);
  const [socketOverrides, onPlugClicked] = useSocketOverridesForItems();
  const [maxItems, setMaxItems] = useState(EXPAND_INCREMENT);
  useEffect(() => {
    setMaxItems(EXPAND_INCREMENT);
  }, [categories]);
  const expandItems = useCallback(() => setMaxItems((m) => m + EXPAND_INCREMENT), []);

  const allItems = useSelector(allItemsSelector);
  const searchFilter = useSelector(searchFilterSelector);
  const originalItems = useMemo(() => {
    const terminal = Boolean(categories.at(-1)?.terminal);
    if (!terminal) {
      return emptyArray<DimItem>();
    }
    const categoryHashes = categories.map((s) => s.itemCategoryHash).filter((h) => h !== 0);
    // a top level class-specific category implies armor
    if (armorTopLevelCatHashes.some((h) => categoryHashes.includes(h))) {
      categoryHashes.push(ItemCategoryHashes.Armor);
    }
    const items = allItems.filter(
      (i) =>
        i.comparable &&
        categoryHashes.every((h) => i.itemCategoryHashes.includes(h)) &&
        searchFilter(i),
    );
    return items;
  }, [allItems, categories, searchFilter]);

  const firstCategory = categories[1];
  const isWeapon = Boolean(firstCategory?.itemCategoryHash === ItemCategoryHashes.Weapon);
  const isGhost = Boolean(firstCategory?.itemCategoryHash === ItemCategoryHashes.Ghost);
  const isArmor = !isWeapon && !isGhost;
  const itemType = isWeapon ? 'weapon' : isArmor ? 'armor' : 'ghost';

  const stores = useSelector(storesSelector);
  const getTag = useSelector(getTagSelector);
  const getNotes = useSelector(getNotesSelector);
  const wishList = useSelector(wishListFunctionSelector);
  const hasWishList = useSelector(hasWishListSelector);
  const enabledColumns = useSelector(settingSelector(columnSetting(itemType)));
  const itemCreationContext = useSelector(createItemContextSelector);
  const loadoutsByItem = useSelector(loadoutsByItemSelector);
  const newItems = useSelector(newItemsSelector);
  const destinyVersion = useSelector(destinyVersionSelector);
  const dispatch = useThunkDispatch();

  const { customStats } = itemCreationContext;

  const classCategoryHash = categories
    .map((n) => n.itemCategoryHash)
    .find((hash) => hash in categoryToClass);
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

  // Are we at a item category that can show items?
  const terminal = Boolean(categories.at(-1)?.terminal);

  const defs = useD2Definitions();
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
  const stats = useMemo(
    () => (terminal ? buildStatInfo(items) : emptyArray<DimStat>()),
    [terminal, items],
  );

  const columns: ColumnDefinition[] = useMemo(
    () =>
      getColumns(
        'organizer',
        itemType,
        stats,
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
      stats,
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

  // This needs work for sure
  const filteredColumns = useMemo(
    () =>
      compact(
        columns.filter(
          (column) =>
            enabledColumns.includes(getColumnSelectionId(column)) &&
            (column.limitToClass === undefined || column.limitToClass === classIfAny),
        ),
      ),
    [columns, enabledColumns, classIfAny],
  );

  // process items into Rows
  const [unsortedRows, tableContext] = useMemo(
    () => buildRows(items, filteredColumns),
    [filteredColumns, items],
  );
  const language = useSelector(languageSelector);
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

  const onLock = loadingTracker.trackPromise(async (lock: boolean) => {
    dispatch(bulkLockItems(selectedItems, lock));
  });

  const [bulkNoteDialog, bulkNote] = useBulkNote();
  const onNote = () => bulkNote(selectedItems);

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
                node.dataset.filterValue ??
                  node.parentElement?.dataset.filterValue ?? // look for filter-value at most 1 element up
                  row.values[column.id],
                row.item,
              );
              if (filter !== undefined) {
                dispatch(toggleSearchQueryComponent(filter));
              }
            }

            if (e.ctrlKey) {
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
      if (tagInfo.type && selectedItemIds.length) {
        const selectedItems = items.filter((i) => selectedItemIds.includes(i.id));
        dispatch(bulkTagItems(selectedItems, tagInfo.type, true));
      }
    },
    [dispatch, items, selectedItemIds],
  );

  const onCompareSelectedItems = useCallback(() => {
    if (selectedItemIds.length) {
      const selectedItems = items.filter((i) => selectedItemIds.includes(i.id));
      dispatch(compareSelectedItems(selectedItems));
    }
  }, [dispatch, items, selectedItemIds]);

  const gridSpec = `min-content ${filteredColumns
    .map((c) => c.gridWidth ?? 'min-content')
    .join(' ')}`;

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
    const checked = e.target.checked;
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

    if (checked) {
      setSelectedItemIds((selected) => [...new Set([...selected, ...changingIds])]);
    } else {
      setSelectedItemIds((selected) => selected.filter((i) => !changingIds.includes(i)));
    }

    lastSelectedId.current = item.id;
  };

  let downloadAction: ReactNode | null = null;
  const downloadButtonSetting = downloadButtonSettings.find((setting) =>
    setting.categoryId.includes(categories[1]?.id),
  );
  if (downloadButtonSetting) {
    const downloadHandler = (e: React.MouseEvent) => {
      e.preventDefault();
      dispatch(downloadCsvFiles(downloadButtonSetting.csvType));
      return false;
    };

    downloadAction = (
      <button
        type="button"
        className={clsx(styles.importButton, 'dim-button')}
        onClick={downloadHandler}
      >
        <AppIcon icon={spreadsheetIcon} /> <span>{t(downloadButtonSetting.label)}.csv</span>
      </button>
    );
  }

  const [confirmDialog, confirm] = useConfirm();
  const importCsv: DropzoneOptions['onDrop'] = async (acceptedFiles) => {
    if (acceptedFiles.length < 1) {
      showNotification({ type: 'error', title: t('Csv.ImportWrongFileType') });
      return;
    }

    if (!(await confirm(t('Csv.ImportConfirm')))) {
      return;
    }
    try {
      const result = await dispatch(importTagsNotesFromCsv(acceptedFiles));
      showNotification({ type: 'success', title: t('Csv.ImportSuccess', { count: result }) });
    } catch (e) {
      showNotification({ type: 'error', title: t('Csv.ImportFailed', { error: errorMessage(e) }) });
    }
  };

  const toolbarRef = useRef(null);
  useSetCSSVarToHeight(toolbarRef, '--item-table-toolbar-height');

  return (
    <>
      <div
        className={clsx(styles.table, shiftHeld && styles.shiftHeld)}
        style={{ gridTemplateColumns: gridSpec }}
        role="table"
        ref={tableRef}
      >
        {confirmDialog}
        {bulkNoteDialog}
        <div className={styles.toolbar} ref={toolbarRef}>
          <ItemActions
            itemsAreSelected={Boolean(selectedItems.length)}
            onLock={onLock}
            onNote={onNote}
            stores={stores}
            onTagSelectedItems={onTagSelectedItems}
            onMoveSelectedItems={onMoveSelectedItems}
            onCompareSelectedItems={onCompareSelectedItems}
          />
          <UserGuideLink topic="Organizer" />
          <Dropzone onDrop={importCsv} accept={{ 'text/csv': ['.csv'] }} useFsAccessApi={false}>
            {({ getRootProps, getInputProps }) => (
              <div {...getRootProps()} className={styles.importButton}>
                <input {...getInputProps()} />
                <div className="dim-button">
                  <AppIcon icon={uploadIcon} /> {t('Settings.CsvImport')}
                </div>
              </div>
            )}
          </Dropzone>
          {downloadAction}
          <EnabledColumnsSelector
            columns={columns}
            enabledColumns={enabledColumns}
            onChangeEnabledColumn={onChangeEnabledColumn}
            forClass={classIfAny}
          />
        </div>
        <div className={styles.headerRow} role="row">
          <div
            className={clsx(styles.selection, styles.header)}
            role="columnheader"
            aria-sort="none"
          >
            <div>
              <input
                name="selectAll"
                title={t('Organizer.SelectAll')}
                type="checkbox"
                checked={selectedItems.length === rows.length}
                ref={(el) => {
                  el &&
                    (el.indeterminate =
                      selectedItems.length !== rows.length && selectedItems.length > 0);
                }}
                onChange={selectAllItems}
              />
            </div>
          </div>
          {filteredColumns.map((column) => {
            const columnSort = column.noSort
              ? undefined
              : columnSorts.find((c) => c.columnId === column.id);
            return (
              <div
                key={column.id}
                className={clsx(column.headerClassName, styles.header)}
                role="columnheader"
                aria-sort={
                  columnSort === undefined
                    ? 'none'
                    : columnSort.sort === SortDirection.DESC
                      ? 'descending'
                      : 'ascending'
                }
              >
                <div
                  onClick={
                    column.noSort
                      ? undefined
                      : toggleColumnSort(column.id, shiftHeld, column.defaultSort)
                  }
                >
                  {column.header}
                  {columnSort && (
                    <AppIcon
                      className={styles.sorter}
                      icon={columnSort.sort === SortDirection.DESC ? faCaretDown : faCaretUp}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {rows.length === 0 && <div className={styles.noItems}>{t('Organizer.NoItems')}</div>}
        {rows.slice(0, maxItems).map((row) => (
          <div key={row.item.id} className={styles.row} role="row">
            <div className={styles.selection} role="cell">
              <input
                type="checkbox"
                title={t('Organizer.SelectItem', { name: row.item.name })}
                checked={selectedItemIds.includes(row.item.id)}
                onChange={(e) => selectItem(e, row.item)}
              />
            </div>
            <MemoRow
              row={row}
              filteredColumns={filteredColumns}
              onRowClick={onRowClick}
              tableCtx={tableContext}
            />
          </div>
        ))}
      </div>
      {rows.length > maxItems && <ItemListExpander numItems={maxItems} onExpand={expandItems} />}
    </>
  );
}

/**
 * Build a list of rows with materialized values.
 */
export function buildRows(items: DimItem[], filteredColumns: ColumnDefinition[]) {
  const unsortedRows: Row[] = items.map((item) => ({
    item,
    values: filteredColumns.reduce<Row['values']>((memo, col) => {
      memo[col.id] = col.value(item);
      return memo;
    }, {}),
  }));

  // Build a map of min/max values for each column
  // TODO: Use these to color stats in the ItemTable view
  const ctx: TableContext = { minMaxValues: {} };
  for (const column of filteredColumns) {
    if (column.cell) {
      for (const row of unsortedRows) {
        const value = row.values[column.id];
        if (typeof value === 'number') {
          const minMax = (ctx.minMaxValues[column.id] ??= { min: value, max: value });
          minMax.min = Math.min(minMax.min, value);
          minMax.max = Math.max(minMax.max, value);
        }
      }
    }
  }

  return [unsortedRows, ctx] as const;
}

/**
 * Sort the rows based on the selected columns.
 */
export function sortRows(
  unsortedRows: Row[],
  columnSorts: ColumnSort[],
  filteredColumns: ColumnDefinition[],
  language: DimLanguage,
  defaultComparator?: Comparator<Row>,
) {
  if (!columnSorts.length && defaultComparator) {
    return unsortedRows.toSorted(defaultComparator);
  }

  const comparator = chainComparator<Row>(
    ...columnSorts.map((sorter) => {
      const column = filteredColumns.find((c) => c.id === sorter.columnId);
      if (column) {
        const sort = column.sort;
        const compare: Comparator<Row> = sort
          ? (row1, row2) =>
              sort(row1.values[column.id], row2.values[column.id], row1.item, row2.item)
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
  tableCtx,
}: {
  row: Row;
  filteredColumns: ColumnDefinition[];
  tableCtx: TableContext;
  onRowClick: (
    row: Row,
    column: ColumnDefinition,
  ) => ((event: React.MouseEvent<HTMLTableCellElement>) => void) | undefined;
}) {
  return (
    <>
      {filteredColumns.map((column) => (
        // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
        <div
          key={column.id}
          onClick={onRowClick(row, column)}
          className={clsx(column.className, {
            [styles.hasFilter]: column.filter !== undefined,
          })}
          role="cell"
        >
          {column.cell
            ? column.cell(row.values[column.id], row.item, tableCtx.minMaxValues[column.id])
            : row.values[column.id]}
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

function ItemListExpander({ onExpand, numItems }: { onExpand: () => void; numItems: number }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const elem = ref.current;
    if (!elem) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            onExpand();
          }
        }
      },
      {
        root: null,
        rootMargin: '16px',
        threshold: 0,
      },
    );

    observer.observe(elem);

    return () => observer.unobserve(elem);
  }, [
    onExpand,
    // This is a hack to fix the case where:
    // 1. The expander is on screen when the component renders.
    // 2. After adding more items, it's still on screen. Since the observer only
    //    runs if the item is initially onscreen, or enters the screen, there
    //    are no changes. So we'll just reconstruct the observer every time to
    //    allow it to re-fire if it's still on the screen.
    numItems,
  ]);

  return <div ref={ref} />;
}
