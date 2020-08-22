/* eslint-disable react/jsx-key, react/prop-types */
import React, { useMemo, useState, useRef, useCallback, useEffect, ReactNode } from 'react';
import { DimItem } from 'app/inventory/item-types';
import { AppIcon, faCaretUp, faCaretDown, spreadsheetIcon, uploadIcon } from 'app/shell/icons';
import styles from './ItemTable.m.scss';
import { ItemCategoryTreeNode } from './ItemTypeSelector';
import _ from 'lodash';
import { ItemInfos, TagInfo } from 'app/inventory/dim-item-info';
import { DtrRating } from 'app/item-review/dtr-api-types';
import { InventoryWishListRoll } from 'app/wishlists/wishlists';
import { loadingTracker } from 'app/shell/loading-tracker';
import { showNotification } from 'app/notifications/notifications';
import { t, tl } from 'app/i18next-t';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import ItemActions from './ItemActions';
import { DimStore } from 'app/inventory/store-types';
import EnabledColumnsSelector from './EnabledColumnsSelector';
import { bulkTagItems } from 'app/inventory/tag-items';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import { RootState, ThunkDispatchProp } from 'app/store/types';
import { storesSelector, itemInfosSelector } from 'app/inventory/selectors';
import { searchFilterSelector } from 'app/search/search-filter';
import { inventoryWishListsSelector } from 'app/wishlists/reducer';
import { toggleSearchQueryComponent } from 'app/shell/actions';
import clsx from 'clsx';
import { useShiftHeld } from 'app/utils/hooks';
import { newLoadout, convertToLoadoutItem } from 'app/loadout/loadout-utils';
import { applyLoadout } from 'app/loadout/loadout-apply';
import { getColumns, getColumnSelectionId } from './Columns';
import { ratingsSelector } from 'app/item-review/reducer';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import { setItemLockState } from 'app/inventory/item-move-service';
import { emptyObject, emptyArray } from 'app/utils/empty';
import { Row, ColumnDefinition, SortDirection, ColumnSort } from './table-types';
import { compareBy, chainComparator, reverseComparator } from 'app/utils/comparators';
import { touch, setItemNote, touchItem } from 'app/inventory/actions';
import { settingsSelector } from 'app/settings/reducer';
import { setSetting } from 'app/settings/actions';
import { StatHashListsKeyedByDestinyClass } from 'app/dim-ui/CustomStatTotal';
import { Loadout } from 'app/loadout/loadout-types';
import { loadoutsSelector } from 'app/loadout/reducer';
import { StatInfo } from 'app/compare/Compare';
import { downloadCsvFiles, importTagsNotesFromCsv } from 'app/inventory/spreadsheets';
import Dropzone, { DropzoneOptions } from 'react-dropzone';
import UserGuideLink from 'app/dim-ui/UserGuideLink';

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
  defs: D2ManifestDefinitions;
  itemInfos: ItemInfos;
  ratings: { [key: string]: DtrRating };
  wishList: {
    [key: string]: InventoryWishListRoll;
  };
  isPhonePortrait: boolean;
  enabledColumns: string[];
  customTotalStatsByClass: StatHashListsKeyedByDestinyClass;
  loadouts: Loadout[];
  newItems: Set<string>;
}

function mapStateToProps() {
  const itemsSelector = createSelector(
    storesSelector,
    searchFilterSelector,
    (_, props: ProvidedProps) => props.categories,
    (stores, searchFilter, categories) => {
      const terminal = Boolean(_.last(categories)?.terminal);
      if (!terminal) {
        return emptyArray<DimItem>();
      }
      const categoryHashes = categories.map((s) => s.itemCategoryHash).filter((h) => h > 0);
      const items = stores.flatMap((s) =>
        s.items.filter(
          (i) =>
            i.comparable &&
            categoryHashes.every((h) => i.itemCategoryHashes.includes(h)) &&
            searchFilter(i)
        )
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
      defs: state.manifest.d2Manifest!,
      stores: storesSelector(state),
      itemInfos: itemInfosSelector(state),
      ratings: $featureFlags.reviewsEnabled ? ratingsSelector(state) : emptyObject(),
      wishList: inventoryWishListsSelector(state),
      isPhonePortrait: state.shell.isPhonePortrait,
      enabledColumns: settingsSelector(state)[columnSetting(itemType)],
      customTotalStatsByClass: settingsSelector(state).customTotalStatsByClass,
      loadouts: loadoutsSelector(state),
      newItems: state.inventory.newItems,
    };
  };
}

type Props = ProvidedProps & StoreProps & ThunkDispatchProp;

const MemoRow = React.memo(TableRow);

function ItemTable({
  items,
  categories,
  itemInfos,
  ratings,
  wishList,
  defs,
  stores,
  enabledColumns,
  customTotalStatsByClass,
  loadouts,
  newItems,
  dispatch,
}: Props) {
  const [columnSorts, setColumnSorts] = useState<ColumnSort[]>([
    { columnId: 'name', sort: SortDirection.ASC },
  ]);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  // Track the last selection for shift-selecting
  const lastSelectedId = useRef<string | null>(null);

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

  // Build a list of all the stats relevant to this set of items
  const statHashes = useMemo(
    () => buildStatInfo(items, categories),
    // We happen to know that we only need to recalculate this when the categories change
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [categories]
  );

  const firstItem = items[0];
  const isWeapon = Boolean(firstItem?.bucket.inWeapons);
  const isArmor = Boolean(firstItem?.bucket.inArmor);
  const itemType = isWeapon ? 'weapon' : isArmor ? 'armor' : 'ghost';
  const customStatTotal = customTotalStatsByClass[classIfAny] ?? emptyArray();
  const destinyVersion = firstItem?.destinyVersion || 2;

  const columns: ColumnDefinition[] = useMemo(
    () =>
      getColumns(
        itemType,
        statHashes,
        classIfAny,
        defs,
        itemInfos,
        ratings,
        wishList,
        customStatTotal,
        loadouts,
        newItems,
        destinyVersion
      ),
    [
      wishList,
      statHashes,
      itemType,
      itemInfos,
      ratings,
      defs,
      customStatTotal,
      classIfAny,
      loadouts,
      newItems,
      destinyVersion,
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
  const unsortedRows: Row[] = useMemo(() => buildRows(items, filteredColumns), [
    filteredColumns,
    items,
  ]);
  const rows = useMemo(() => sortRows(unsortedRows, columnSorts, filteredColumns), [
    unsortedRows,
    filteredColumns,
    columnSorts,
  ]);

  const shiftHeld = useShiftHeld();

  const onChangeEnabledColumn = useCallback(
    ({ checked, id }: { checked: boolean; id: string }) => {
      dispatch(
        setSetting(
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
  // TODO: stolen from SearchFilter, should probably refactor into a shared thing
  const onLock = loadingTracker.trackPromise(async (lock: boolean) => {
    const selectedItems = items.filter((i) => selectedItemIds.includes(i.id));

    const state = lock;
    try {
      for (const item of selectedItems) {
        await setItemLockState(item, state);

        // TODO: Gotta do this differently in react land
        item.locked = lock;
        dispatch(touchItem(item.id));
      }
      showNotification({
        type: 'success',
        title: state
          ? t('Filter.LockAllSuccess', { num: selectedItems.length })
          : t('Filter.UnlockAllSuccess', { num: selectedItems.length }),
      });
    } catch (e) {
      showNotification({
        type: 'error',
        title: state ? t('Filter.LockAllFailed') : t('Filter.UnlockAllFailed'),
        body: e.message,
      });
    } finally {
      // Touch the stores service to update state
      if (selectedItems.length) {
        dispatch(touch());
      }
    }
  });

  const onNote = (note?: string) => {
    if (!note) {
      note = undefined;
    }
    if (selectedItemIds.length) {
      const selectedItems = items.filter((i) => selectedItemIds.includes(i.id));
      for (const item of selectedItems) {
        dispatch(setItemNote({ itemId: item.id, note }));
      }
    }
  };

  /**
   * When shift-clicking a value, if there's a filter function defined, narrow/un-narrow the search
   */
  const narrowQueryFunction = useCallback(
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
          }
        : undefined,
    [dispatch]
  );

  const onMoveSelectedItems = (store: DimStore) => {
    if (selectedItemIds.length) {
      const selectedItems = items.filter((i) => selectedItemIds.includes(i.id));
      const loadout = newLoadout(
        t('Organizer.BulkMoveLoadoutName'),
        selectedItems.map((i) => convertToLoadoutItem(i, false))
      );

      applyLoadout(store, loadout, true);
    }
  };

  const onTagSelectedItems = (tagInfo: TagInfo) => {
    if (tagInfo.type && selectedItemIds.length) {
      const selectedItems = items.filter((i) => selectedItemIds.includes(i.id));
      dispatch(bulkTagItems(selectedItems, tagInfo.type));
    }
  };

  const gridSpec = `min-content ${filteredColumns
    .map((c) => c.gridWidth ?? 'min-content')
    .join(' ')}`;

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
    if (selectedItemIds.length === 0) {
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
    const downloadCsv = (type: 'Armor' | 'Weapons' | 'Ghost') => {
      downloadCsvFiles(stores, itemInfos, type);
      ga('send', 'event', 'Download CSV', type);
    };
    const downloadHandler = (e) => {
      e.preventDefault();
      downloadCsv(downloadButtonSetting.csvType);
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

  return (
    <div
      className={clsx(styles.table, 'show-new-items', shiftHeld && styles.shiftHeld)}
      style={{ gridTemplateColumns: gridSpec }}
      role="table"
      ref={tableRef}
    >
      <div className={styles.toolbar}>
        <div>
          <ItemActions
            itemsAreSelected={Boolean(selectedItemIds.length)}
            onLock={onLock}
            onNote={onNote}
            stores={stores}
            onTagSelectedItems={onTagSelectedItems}
            onMoveSelectedItems={onMoveSelectedItems}
          />
          <UserGuideLink topic="Organizer" className={styles.guideLink} />
          <Dropzone onDrop={importCsv} accept=".csv">
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
      </div>
      <div className={clsx(styles.selection, styles.header)} role="columnheader" aria-sort="none">
        <input
          name="selectAll"
          title={t('Organizer.SelectAll')}
          type="checkbox"
          checked={selectedItemIds.length === rows.length}
          ref={(el) =>
            el &&
            (el.indeterminate =
              selectedItemIds.length !== rows.length && selectedItemIds.length > 0)
          }
          onChange={selectAllItems}
        />
      </div>
      {filteredColumns.map((column: ColumnDefinition) => (
        <div
          key={column.id}
          className={clsx(styles[column.id], styles.header)}
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
          <MemoRow
            row={row}
            filteredColumns={filteredColumns}
            narrowQueryFunction={narrowQueryFunction}
          />
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
    values: filteredColumns.reduce((memo, col) => {
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
          : compareBy((row: Row) => row.values[column.id]);
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
function buildStatInfo(
  items: DimItem[],
  categories: ItemCategoryTreeNode[]
): {
  [statHash: number]: StatInfo;
} {
  const terminal = Boolean(_.last(categories)?.terminal);
  if (!terminal) {
    return emptyObject();
  }
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
  narrowQueryFunction,
}: {
  row: Row;
  filteredColumns: ColumnDefinition[];
  narrowQueryFunction(
    row: Row,
    column: ColumnDefinition
  ): ((event: React.MouseEvent<HTMLTableDataCellElement, MouseEvent>) => void) | undefined;
}) {
  return (
    <>
      {filteredColumns.map((column: ColumnDefinition) => (
        // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
        <div
          key={column.id}
          onClick={narrowQueryFunction(row, column)}
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
