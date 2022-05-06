import { DestinyVersion } from '@destinyitemmanager/dim-api-types';
import { destinyVersionSelector } from 'app/accounts/selectors';
import { StatInfo } from 'app/compare/Compare';
import { settingsSelector } from 'app/dim-api/selectors';
import { StatHashListsKeyedByDestinyClass } from 'app/dim-ui/CustomStatTotal';
import UserGuideLink from 'app/dim-ui/UserGuideLink';
import { t, tl } from 'app/i18next-t';
import { setItemNote } from 'app/inventory/actions';
import { bulkLockItems, bulkTagItems } from 'app/inventory/bulk-actions';
import { ItemInfos, TagInfo } from 'app/inventory/dim-item-info';
import { DimItem } from 'app/inventory/item-types';
import {
  allItemsSelector,
  itemInfosSelector,
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
import { LoadoutsByItem, loadoutsByItemSelector } from 'app/loadout-drawer/selectors';
import { useD2Definitions } from 'app/manifest/selectors';
import { searchFilterSelector } from 'app/search/search-filter';
import { setSettingAction } from 'app/settings/actions';
import { toggleSearchQueryComponent } from 'app/shell/actions';
import { AppIcon, faCaretDown, faCaretUp, spreadsheetIcon, uploadIcon } from 'app/shell/icons';
import { loadingTracker } from 'app/shell/loading-tracker';
import { RootState, ThunkDispatchProp } from 'app/store/types';
import { chainComparator, compareBy, reverseComparator } from 'app/utils/comparators';
import { emptyArray, emptyObject } from 'app/utils/empty';
import { useSetCSSVarToHeight, useShiftHeld } from 'app/utils/hooks';
import { hasWishListSelector, wishListFunctionSelector } from 'app/wishlists/selectors';
import { InventoryWishListRoll } from 'app/wishlists/wishlists';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import { ItemCategoryHashes } from 'data/d2/generated-enums';
import _ from 'lodash';
import React, { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import Dropzone, { DropzoneOptions } from 'react-dropzone';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import { getColumns, getColumnSelectionId } from './Columns';
import EnabledColumnsSelector from './EnabledColumnsSelector';
import { itemIncludesCategories } from './filtering-utils';
import ItemActions from './ItemActions';
// eslint-disable-next-line css-modules/no-unused-class
import styles from './ItemTable.m.scss';
import { ItemCategoryTreeNode } from './ItemTypeSelector';
import { ColumnDefinition, ColumnSort, Row, SortDirection } from './table-types';

const categoryToClass = {
  23: DestinyClass.Hunter,
  22: DestinyClass.Titan,
  21: DestinyClass.Warlock,
};

const downloadButtonSettings = [
  { categoryId: ['weapons'], csvType: 'Weapons' as const, label: tl('Bucket.Weapons') },
  {
    categoryId: ['hunter', 'titan', 'warlock'],
    csvType: 'Armor' as const,
    label: tl('Bucket.Armor'),
  },
  { categoryId: ['ghosts'], csvType: 'Ghost' as const, label: tl('Bucket.Ghost') },
];

interface ProvidedProps {
  categories: ItemCategoryTreeNode[];
}

interface StoreProps {
  stores: DimStore[];
  items: DimItem[];
  itemInfos: ItemInfos;
  wishList: (item: DimItem) => InventoryWishListRoll | undefined;
  hasWishList: boolean;
  enabledColumns: string[];
  customTotalStatsByClass: StatHashListsKeyedByDestinyClass;
  loadoutsByItem: LoadoutsByItem;
  newItems: Set<string>;
  destinyVersion: DestinyVersion;
}

function mapStateToProps() {
  const itemsSelector = createSelector(
    allItemsSelector,
    searchFilterSelector,
    (_state: RootState, props: ProvidedProps) => props.categories,
    (allItems, searchFilter, categories) => {
      const terminal = Boolean(_.last(categories)?.terminal);
      if (!terminal) {
        return emptyArray<DimItem>();
      }
      const categoryHashes = categories.map((s) => s.itemCategoryHash).filter((h) => h !== 0);
      const items = allItems.filter(
        (i) => i.comparable && itemIncludesCategories(i, categoryHashes) && searchFilter(i)
      );
      return items;
    }
  );

  return (state: RootState, props: ProvidedProps): StoreProps => {
    const items = itemsSelector(state, props);
    const isWeapon = items[0]?.bucket.inWeapons;
    const isArmor = items[0]?.bucket.inArmor;
    const itemType = isWeapon ? 'weapon' : isArmor ? 'armor' : 'ghost';
    return {
      items,
      stores: storesSelector(state),
      itemInfos: itemInfosSelector(state),
      wishList: wishListFunctionSelector(state),
      hasWishList: hasWishListSelector(state),
      enabledColumns: settingsSelector(state)[columnSetting(itemType)],
      customTotalStatsByClass: settingsSelector(state).customTotalStatsByClass,
      loadoutsByItem: loadoutsByItemSelector(state),
      newItems: newItemsSelector(state),
      destinyVersion: destinyVersionSelector(state),
    };
  };
}

type Props = ProvidedProps & StoreProps & ThunkDispatchProp;

const MemoRow = React.memo(TableRow);

function ItemTable({
  items: originalItems,
  categories,
  itemInfos,
  wishList,
  hasWishList,
  stores,
  enabledColumns,
  customTotalStatsByClass,
  loadoutsByItem,
  newItems,
  destinyVersion,
  dispatch,
}: Props) {
  const [columnSorts, setColumnSorts] = useState<ColumnSort[]>([
    { columnId: 'name', sort: SortDirection.ASC },
  ]);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  // Track the last selection for shift-selecting
  const lastSelectedId = useRef<string | null>(null);
  const [socketOverrides, onPlugClicked] = useSocketOverridesForItems();

  const classCategoryHash =
    categories.map((n) => n.itemCategoryHash).find((hash) => hash in categoryToClass) ?? 999;
  const classIfAny: DestinyClass = categoryToClass[classCategoryHash] ?? DestinyClass.Unknown;

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

      document.querySelector('html')!.style.setProperty('--table-header-height', height + 1 + 'px');
    }
  });

  // Are we at a item category that can show items?
  const terminal = Boolean(_.last(categories)?.terminal);

  const defs = useD2Definitions();
  const items = useMemo(
    () =>
      defs
        ? originalItems.map((item) => applySocketOverrides(defs, item, socketOverrides[item.id]))
        : originalItems,
    [defs, originalItems, socketOverrides]
  );

  // Build a list of all the stats relevant to this set of items
  const statHashes = useMemo(
    () =>
      terminal
        ? buildStatInfo(items)
        : emptyObject<{
            [statHash: number]: StatInfo;
          }>(),
    [terminal, items]
  );

  const firstCategory = categories[1];
  const isWeapon = Boolean(firstCategory?.itemCategoryHash === ItemCategoryHashes.Weapon);
  const isGhost = Boolean(firstCategory?.itemCategoryHash === ItemCategoryHashes.Ghost);
  const isArmor = !isWeapon && !isGhost;
  const itemType = isWeapon ? 'weapon' : isArmor ? 'armor' : 'ghost';
  const customStatTotal = customTotalStatsByClass[classIfAny] ?? emptyArray();

  const columns: ColumnDefinition[] = useMemo(
    () =>
      getColumns(
        itemType,
        statHashes,
        classIfAny,
        itemInfos,
        wishList,
        hasWishList,
        customStatTotal,
        loadoutsByItem,
        newItems,
        destinyVersion,
        onPlugClicked
      ),
    [
      wishList,
      hasWishList,
      statHashes,
      itemType,
      itemInfos,
      customStatTotal,
      classIfAny,
      loadoutsByItem,
      newItems,
      destinyVersion,
      onPlugClicked,
    ]
  );

  // This needs work for sure
  const filteredColumns = useMemo(
    () =>
      _.compact(
        enabledColumns.flatMap((id) =>
          columns.filter((column) => id === getColumnSelectionId(column))
        )
      ),
    [columns, enabledColumns]
  );

  // process items into Rows
  const unsortedRows: Row[] = useMemo(
    () => buildRows(items, filteredColumns),
    [filteredColumns, items]
  );
  const rows = useMemo(
    () => sortRows(unsortedRows, columnSorts, filteredColumns),
    [unsortedRows, filteredColumns, columnSorts]
  );

  const shiftHeld = useShiftHeld();

  const onChangeEnabledColumn = useCallback(
    ({ checked, id }: { checked: boolean; id: string }) => {
      dispatch(
        setSettingAction(
          columnSetting(itemType),
          _.uniq(
            _.compact(
              columns.map((c) => {
                const cId = getColumnSelectionId(c);
                if (cId === id) {
                  return checked ? cId : undefined;
                } else {
                  return enabledColumns.includes(cId) ? cId : undefined;
                }
              })
            )
          )
        )
      );
    },
    [dispatch, columns, enabledColumns, itemType]
  );

  const selectedItems = items.filter((i) => selectedItemIds.includes(i.id));

  const onLock = loadingTracker.trackPromise(async (lock: boolean) => {
    dispatch(bulkLockItems(selectedItems, lock));
  });

  const onNote = (note?: string) => {
    if (!note) {
      note = undefined;
    }
    if (selectedItems.length) {
      for (const item of selectedItems) {
        dispatch(setItemNote({ itemId: item.id, note }));
      }
    }
  };

  /**
   * Handles Click Events for Table Rows
   * When shift-clicking a value, if there's a filter function defined, narrow/un-narrow the search
   * When ctrl-clicking toggles selected value
   */
  const onRowClick = useCallback(
    (
      row: Row,
      column: ColumnDefinition
    ): React.MouseEventHandler<HTMLTableDataCellElement> | undefined =>
      column.filter
        ? (e) => {
            if (e.shiftKey) {
              if ((e.target as Element).hasAttribute('data-perk-name')) {
                const filter = column.filter!(
                  (e.target as Element).getAttribute('data-perk-name'),
                  row.item
                );
                if (filter) {
                  dispatch(toggleSearchQueryComponent(filter));
                }
                return;
              }
              const filter = column.filter!(row.values[column.id], row.item);
              if (filter !== undefined) {
                dispatch(toggleSearchQueryComponent(filter));
              }
            }

            if (e.ctrlKey) {
              setSelectedItemIds(
                selectedItemIds.findIndex((selectedItemId) => selectedItemId === row.item.id) === -1
                  ? [...selectedItemIds, row.item.id]
                  : selectedItemIds.filter((id) => id !== row.item.id)
              );
            }
          }
        : undefined,
    [dispatch, selectedItemIds]
  );

  const onMoveSelectedItems = (store: DimStore) => {
    if (selectedItems.length) {
      const loadout = newLoadout(
        t('Organizer.BulkMoveLoadoutName'),
        selectedItems.map((i) => convertToLoadoutItem(i, false))
      );

      dispatch(applyLoadout(store, loadout, { allowUndo: true }));
    }
  };

  const onTagSelectedItems = (tagInfo: TagInfo) => {
    if (tagInfo.type && selectedItemIds.length) {
      const selectedItems = items.filter((i) => selectedItemIds.includes(i.id));
      dispatch(bulkTagItems(selectedItems, tagInfo.type, false));
    }
  };

  const gridSpec = `min-content ${filteredColumns
    .map((c) => c.gridWidth ?? 'min-content')
    .join(' ')}`;

  const numColumns = filteredColumns.length + 1;

  const rowStyle = [...Array(numColumns).keys()]
    .map(
      (_v, n) =>
        `[role="cell"]:nth-of-type(${numColumns * 2}n+${
          n + 2
        }){background-color:#1d1c2b !important;}`
    )
    .join('\n');

  /**
   * Toggle sorting of columns. If shift is held, adds this column to the sort.
   */
  const toggleColumnSort = (column: ColumnDefinition) => () => {
    setColumnSorts((sorts) => {
      const newColumnSorts = shiftHeld
        ? Array.from(sorts)
        : sorts.filter((s) => s.columnId === column.id);
      let found = false;
      let index = 0;
      for (const columnSort of newColumnSorts) {
        if (columnSort.columnId === column.id) {
          newColumnSorts[index] = {
            ...columnSort,
            sort: columnSort.sort === SortDirection.ASC ? SortDirection.DESC : SortDirection.ASC,
          };
          found = true;
          break;
        }
        index++;
      }
      if (!found) {
        newColumnSorts.push({
          columnId: column.id,
          sort: column.defaultSort || SortDirection.ASC,
        });
      }
      return newColumnSorts;
    });
  };

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
      setSelectedItemIds((selected) => _.uniq([...selected, ...changingIds]));
    } else {
      setSelectedItemIds((selected) => selected.filter((i) => !changingIds.includes(i)));
    }

    lastSelectedId.current = item.id;
  };

  // TODO: drive the CSV export off the same column definitions as this table!
  let downloadAction: ReactNode | null = null;
  const downloadButtonSetting = downloadButtonSettings.find((setting) =>
    setting.categoryId.includes(categories[1]?.id)
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

  const importCsv: DropzoneOptions['onDrop'] = async (acceptedFiles) => {
    if (acceptedFiles.length < 1) {
      alert(t('Csv.ImportWrongFileType'));
      return;
    }

    if (!confirm(t('Csv.ImportConfirm'))) {
      return;
    }
    try {
      const result = await dispatch(importTagsNotesFromCsv(acceptedFiles));
      alert(t('Csv.ImportSuccess', { count: result }));
    } catch (e) {
      alert(t('Csv.ImportFailed', { error: e.message }));
    }
  };

  const toolbarRef = useRef(null);
  useSetCSSVarToHeight(toolbarRef, '--item-table-toolbar-height');

  return (
    <div
      className={clsx(styles.table, 'show-new-items', shiftHeld && styles.shiftHeld)}
      style={{ gridTemplateColumns: gridSpec }}
      role="table"
      ref={tableRef}
    >
      <div className={styles.toolbar} ref={toolbarRef}>
        <div>
          <ItemActions
            itemsAreSelected={Boolean(selectedItems.length)}
            onLock={onLock}
            onNote={onNote}
            stores={stores}
            onTagSelectedItems={onTagSelectedItems}
            onMoveSelectedItems={onMoveSelectedItems}
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
        {ReactDOM.createPortal(<style>{rowStyle}</style>, document.head)}
      </div>
      <div className={clsx(styles.selection, styles.header)} role="columnheader" aria-sort="none">
        <div>
          <input
            name="selectAll"
            title={t('Organizer.SelectAll')}
            type="checkbox"
            checked={selectedItems.length === rows.length}
            ref={(el) =>
              el &&
              (el.indeterminate = selectedItems.length !== rows.length && selectedItems.length > 0)
            }
            onChange={selectAllItems}
          />
        </div>
      </div>
      {filteredColumns.map((column: ColumnDefinition) => (
        <div
          key={column.id}
          className={clsx(styles[column.id], styles.header, {
            [styles.stats]: ['stats', 'baseStats'].includes(column.columnGroup?.id ?? ''),
          })}
          role="columnheader"
          aria-sort="none"
        >
          <div onClick={column.noSort ? undefined : toggleColumnSort(column)}>
            {column.header}
            {!column.noSort && columnSorts.some((c) => c.columnId === column.id) && (
              <AppIcon
                className={styles.sorter}
                icon={
                  columnSorts.find((c) => c.columnId === column.id)!.sort === SortDirection.DESC
                    ? faCaretUp
                    : faCaretDown
                }
              />
            )}
          </div>
        </div>
      ))}
      {rows.length === 0 && <div className={styles.noItems}>{t('Organizer.NoItems')}</div>}
      {rows.map((row) => (
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
  filteredColumns: ColumnDefinition[]
) {
  const comparator = chainComparator<Row>(
    ...columnSorts.map((sorter) => {
      const column = filteredColumns.find((c) => c.id === sorter.columnId);
      if (column) {
        const compare = column.sort
          ? (row1: Row, row2: Row) => column.sort!(row1.values[column.id], row2.values[column.id])
          : compareBy((row: Row) => row.values[column.id] ?? 0);
        return sorter.sort === SortDirection.ASC ? compare : reverseComparator(compare);
      }
      return compareBy(() => 0);
    })
  );

  return Array.from(unsortedRows).sort(comparator);
}

/**
 * This builds stat infos for all the stats that are relevant to a particular category of items.
 * It will return the same result for the same category, since all items in a category share stats.
 */
function buildStatInfo(items: DimItem[]): {
  [statHash: number]: StatInfo;
} {
  const statHashes: {
    [statHash: number]: StatInfo;
  } = {};
  for (const item of items) {
    if (item.stats) {
      for (const stat of item.stats) {
        if (statHashes[stat.statHash]) {
          // TODO: we don't yet use the min and max values
          statHashes[stat.statHash].max = Math.max(statHashes[stat.statHash].max, stat.value);
          statHashes[stat.statHash].min = Math.min(statHashes[stat.statHash].min, stat.value);
        } else {
          statHashes[stat.statHash] = {
            id: stat.statHash,
            displayProperties: stat.displayProperties,
            min: stat.value,
            max: stat.value,
            enabled: true,
            lowerBetter: stat.smallerIsBetter,
            statMaximumValue: stat.maximumValue,
            bar: stat.bar,
            getStat(item) {
              return item.stats ? item.stats.find((s) => s.statHash === stat.statHash) : undefined;
            },
          };
        }
      }
    }
  }
  return statHashes;
}

function TableRow({
  row,
  filteredColumns,
  onRowClick,
}: {
  row: Row;
  filteredColumns: ColumnDefinition[];
  onRowClick(
    row: Row,
    column: ColumnDefinition
  ): ((event: React.MouseEvent<HTMLTableCellElement>) => void) | undefined;
}) {
  return (
    <>
      {filteredColumns.map((column: ColumnDefinition) => (
        // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
        <div
          key={column.id}
          onClick={onRowClick(row, column)}
          className={clsx(styles[column.id], {
            [styles.hasFilter]: column.filter,
          })}
          role="cell"
        >
          {column.cell ? column.cell(row.values[column.id], row.item) : row.values[column.id]}
        </div>
      ))}
    </>
  );
}

export default connect<StoreProps>(mapStateToProps)(ItemTable);

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
