import { destinyVersionSelector } from 'app/accounts/selectors';
import { customStatsSelector, languageSelector } from 'app/dim-api/selectors';
import { SheetHorizontalScrollContainer } from 'app/dim-ui/SheetHorizontalScrollContainer';
import { ColumnSort, SortDirection, useTableColumnSorts } from 'app/dim-ui/table-columns';
import { DimLanguage } from 'app/i18n';
import { t } from 'app/i18next-t';
import { locateItem } from 'app/inventory/locate-item';
import {
  createItemContextSelector,
  getNotesSelector,
  getTagSelector,
  newItemsSelector,
} from 'app/inventory/selectors';
import {
  applySocketOverrides,
  SocketOverridesForItems,
  useSocketOverridesForItems,
} from 'app/inventory/store/override-sockets';
import { loadoutsByItemSelector } from 'app/loadout/selectors';
import { useD2Definitions } from 'app/manifest/selectors';
import { showNotification } from 'app/notifications/notifications';
import { buildStatInfo, StatInfo as ColumnsStatInfo, getColumns } from 'app/organizer/Columns';
import { ColumnDefinition, Row } from 'app/organizer/table-types';
import { weaponMasterworkY2SocketTypeHash } from 'app/search/d2-known-values';
import Checkbox from 'app/settings/Checkbox';
import { useSetting } from 'app/settings/hooks';
import { AppIcon, faAngleLeft, faAngleRight, faList } from 'app/shell/icons';
import { acquisitionRecencyComparator } from 'app/shell/item-comparators';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import { useShiftHeld } from 'app/utils/hooks';
import { localizedSorter } from 'app/utils/intl';
import { StringLookup } from 'app/utils/util-types';
import { hasWishListSelector, wishListFunctionSelector } from 'app/wishlists/selectors';
import { DestinyDisplayPropertiesDefinition } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import _ from 'lodash';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import Sheet from '../dim-ui/Sheet';
import { DimItem, DimSocket } from '../inventory/item-types';
import { chainComparator, Comparator, compareBy, reverseComparator } from '../utils/comparators';
import styles from './Compare.m.scss';
import CompareItem from './CompareItem';
import CompareSuggestions from './CompareSuggestions';
import { endCompareSession, removeCompareItem, updateCompareQuery } from './actions';
import { CompareSession } from './reducer';
import { compareItemsSelector, compareOrganizerLinkSelector } from './selectors';

const possibleStyles = styles as unknown as StringLookup<string>;

export interface StatInfo {
  id: number | 'EnergyCapacity';
  displayProperties: DestinyDisplayPropertiesDefinition;
  min: number;
  max: number;
  statMaximumValue: number;
  bar: boolean;
  enabled: boolean;
  lowerBetter: boolean;
  getStat: StatGetter;
}

/** a DimStat with, at minimum, a statHash */
export interface MinimalStat {
  statHash: number;
  value: number;
  base?: number;
}
type StatGetter = (item: DimItem) => undefined | MinimalStat;

// TODO: replace rows with Column from organizer
// TODO: CSS grid-with-sticky layout
// TODO: dropdowns for query buttons
// TODO: freeform query
// TODO: Allow minimizing the sheet (to make selection easier)
export default function Compare({ session }: { session: CompareSession }) {
  const dispatch = useThunkDispatch();
  const defs = useD2Definitions()!;
  const [compareBaseStats, setCompareBaseStats] = useSetting('compareBaseStats');
  const [assumeWeaponMasterwork, setAssumeWeaponMasterwork] = useSetting('compareWeaponMasterwork');
  const rawCompareItems = useSelector(compareItemsSelector(session.vendorCharacterId));
  const organizerLink = useSelector(compareOrganizerLinkSelector);
  const language = useSelector(languageSelector);
  const shiftHeld = useShiftHeld();

  /** The stat row to highlight */
  const [highlight, setHighlight] = useState<string>();
  const [socketOverrides, onPlugClicked] = useSocketOverridesForItems();

  // TODO: move column sorts here, allow shift-click to sort by multiple columns
  const [columnSorts, toggleColumnSort] = useTableColumnSorts([]);
  // console.log(columnSorts);

  const comparingArmor = rawCompareItems[0]?.bucket.inArmor;
  const comparingWeapons = rawCompareItems[0]?.bucket.inWeapons;
  const type = comparingArmor ? 'armor' : comparingWeapons ? 'weapon' : 'ghost';
  const doCompareBaseStats = Boolean(compareBaseStats && comparingArmor);
  const compareItems = useCompareItems(session, assumeWeaponMasterwork, socketOverrides);

  const cancel = useCallback(() => {
    dispatch(endCompareSession());
  }, [dispatch]);

  // Reset if there ever are no items
  const hasItems = compareItems.length > 0;
  useEffect(() => {
    if (!hasItems) {
      showNotification({
        type: 'warning',
        title: t('Compare.Error.Invalid'),
        body: session.query,
      });
      cancel();
    }
  }, [cancel, hasItems, session.query]);

  const updateQuery = useCallback(
    (newQuery: string) => {
      dispatch(updateCompareQuery(newQuery));
    },
    [dispatch],
  );

  const remove = useCallback(
    (item: DimItem) => {
      if (compareItems.length <= 1) {
        cancel();
      } else {
        dispatch(removeCompareItem(item));
      }
    },
    [cancel, compareItems.length, dispatch],
  );

  const statHashes = useMemo(() => buildStatInfo(compareItems), [compareItems]);
  const columns = useColumnDefinitions(type, statHashes);
  const filteredColumns = columns.filter(
    (column) =>
      !column.columnGroup ||
      (doCompareBaseStats
        ? column.columnGroup.id === 'baseStats'
        : column.columnGroup.id === 'stats'),
  );

  // TODO: reduce columns to the ones for compare
  // TODO: filter them further based on the doCompareBaseStats setting
  // TODO: default sort by recency or whatever
  // TODO: re-sort the columns somehow
  // TODO: The little sort arrow isn't spaced right
  // TODO: clicking the header twice doesn't flip the sort

  // If the session was started with a specific item, this is it
  const initialItem = session.initialItemId
    ? compareItems.find((i) => i.id === session.initialItemId)
    : undefined;
  const firstCompareItem = compareItems[0];
  // The example item is the one we'll use for generating suggestion buttons
  const exampleItem = initialItem || firstCompareItem;

  // process items into Rows
  const unsortedRows: Row[] = useMemo(
    () => buildRows(compareItems, filteredColumns),
    [compareItems, filteredColumns],
  );
  const rows = useMemo(
    () => sortRows(unsortedRows, columnSorts, filteredColumns, language, session.initialItemId),
    [unsortedRows, filteredColumns, columnSorts, language, session.initialItemId],
  );

  const rowElements = useMemo(
    () => (
      <SheetHorizontalScrollContainer>
        {rows.map((row) => (
          <CompareItem
            key={row.item.id}
            item={row.item}
            itemClick={locateItem}
            remove={remove}
            onPlugClicked={onPlugClicked}
            isInitialItem={session.initialItemId === row.item.id}
          >
            {filteredColumns.map((column) => (
              <div key={column.id} className={clsx(possibleStyles[column.id])}>
                {column.cell ? column.cell(row.values[column.id], row.item) : row.values[column.id]}
              </div>
            ))}
          </CompareItem>
        ))}
      </SheetHorizontalScrollContainer>
    ),
    [filteredColumns, onPlugClicked, remove, rows, session.initialItemId],
  );

  const header = (
    <div className={styles.options}>
      {comparingArmor && (
        <Checkbox
          label={t('Compare.CompareBaseStats')}
          name="compareBaseStats"
          value={compareBaseStats}
          onChange={setCompareBaseStats}
        />
      )}
      {comparingWeapons && defs && (
        <Checkbox
          label={t('Compare.AssumeMasterworked')}
          name="compareWeaponMasterwork"
          value={assumeWeaponMasterwork}
          onChange={setAssumeWeaponMasterwork}
        />
      )}
      {exampleItem && <CompareSuggestions exampleItem={exampleItem} onQueryChanged={updateQuery} />}
      {organizerLink && (
        <Link className={styles.organizerLink} to={organizerLink}>
          <AppIcon icon={faList} />
          <span>{t('Organizer.OpenIn')}</span>
        </Link>
      )}
    </div>
  );

  return (
    <Sheet onClose={cancel} header={header} allowClickThrough>
      <div className={styles.bucket} onPointerLeave={() => setHighlight(undefined)}>
        <div className={styles.statList}>
          <div className={styles.spacer} />
          {filteredColumns.map((column) => (
            <div
              key={column.id}
              className={clsx(
                styles.statLabel,
                possibleStyles[column.id],
                // TODO: make a function for this
                !column.noSort && columnSorts.some((c) => c.columnId === column.id)
                  ? columnSorts.find((c) => c.columnId === column.id)!.sort === SortDirection.DESC
                    ? styles.sortDesc
                    : styles.sortAsc
                  : undefined,
              )}
              onPointerEnter={() => setHighlight(column.id)}
              onClick={
                column.noSort
                  ? undefined
                  : toggleColumnSort(column.id, shiftHeld, column.defaultSort)
              }
              aria-sort="none"
            >
              {column.id === highlight && <div className={styles.highlightBar} />}

              {column.header}
              {!column.noSort && columnSorts.some((c) => c.columnId === column.id) && (
                <AppIcon
                  icon={
                    columnSorts.find((c) => c.columnId === column.id)!.sort === SortDirection.DESC
                      ? faAngleRight
                      : faAngleLeft
                  }
                />
              )}
            </div>
          ))}
        </div>
        {rowElements}
      </div>
    </Sheet>
  );
}

function useColumnDefinitions(
  itemType: 'weapon' | 'armor' | 'ghost',
  statHashes: {
    [statHash: number]: ColumnsStatInfo;
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
        'compare',
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

/** Produce new items which have had their sockets changed */
function useCompareItems(
  session: CompareSession,
  assumeWeaponMasterwork: boolean,
  socketOverrides: SocketOverridesForItems,
) {
  const defs = useD2Definitions()!;
  const itemCreationContext = useSelector(createItemContextSelector);
  const rawCompareItems = useSelector(compareItemsSelector(session.vendorCharacterId));

  const comparingWeapons = rawCompareItems[0]?.bucket.inWeapons;
  const doAssumeWeaponMasterworks = Boolean(defs && assumeWeaponMasterwork && comparingWeapons);

  // Produce new items which have had their sockets changed
  return useMemo(() => {
    let items = rawCompareItems;
    if (doAssumeWeaponMasterworks) {
      items = items.map((i) => {
        const y2MasterworkSocket = i.sockets?.allSockets.find(
          (socket) => socket.socketDefinition.socketTypeHash === weaponMasterworkY2SocketTypeHash,
        );
        const plugSet = y2MasterworkSocket?.plugSet;
        const plugged = y2MasterworkSocket?.plugged;
        if (plugSet && plugged) {
          const fullMasterworkPlug = _.maxBy(
            plugSet.plugs.filter(
              (p) => p.plugDef.plug.plugCategoryHash === plugged.plugDef.plug.plugCategoryHash,
            ),
            (plugOption) => plugOption.plugDef.investmentStats[0]?.value,
          );
          if (fullMasterworkPlug) {
            return applySocketOverrides(itemCreationContext, i, {
              [y2MasterworkSocket.socketIndex]: fullMasterworkPlug.plugDef.hash,
            });
          }
        }
        return i;
      });
    }
    items = items.map((i) => applySocketOverrides(itemCreationContext, i, socketOverrides[i.id]));

    return items;
  }, [itemCreationContext, doAssumeWeaponMasterworks, rawCompareItems, socketOverrides]);
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
  initialItemId: string | undefined,
) {
  const comparator = columnSorts.length
    ? chainComparator<Row>(
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
      )
    : chainComparator<Row>(
        compareBy((row) => row.item.id !== initialItemId),
        (a, b) => acquisitionRecencyComparator(a.item, b.item),
      );

  return unsortedRows.toSorted(comparator);
}
