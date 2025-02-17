import { languageSelector } from 'app/dim-api/selectors';
import { SheetHorizontalScrollContainer } from 'app/dim-ui/SheetHorizontalScrollContainer';
import { useTableColumnSorts } from 'app/dim-ui/table-columns';
import { t } from 'app/i18next-t';
import { locateItem } from 'app/inventory/locate-item';
import { createItemContextSelector } from 'app/inventory/selectors';
import { ItemCreationContext } from 'app/inventory/store/d2-item-factory';
import {
  applySocketOverrides,
  useSocketOverridesForItems,
} from 'app/inventory/store/override-sockets';
import { useD2Definitions } from 'app/manifest/selectors';
import { showNotification } from 'app/notifications/notifications';
import { buildRows, sortRows } from 'app/organizer/ItemTable';
import { ColumnDefinition, Row } from 'app/organizer/table-types';
import { weaponMasterworkY2SocketTypeHash } from 'app/search/d2-known-values';
import Checkbox from 'app/settings/Checkbox';
import { useSetting } from 'app/settings/hooks';
import { AppIcon, faList } from 'app/shell/icons';
import { acquisitionRecencyComparator } from 'app/shell/item-comparators';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import { emptyArray } from 'app/utils/empty';
import { maxBy } from 'es-toolkit';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router';
import Sheet from '../dim-ui/Sheet';
import { DimItem, DimSocket, DimStat } from '../inventory/item-types';
import { chainComparator, compareBy } from '../utils/comparators';
import styles from './Compare.m.scss';
import { getColumns } from './CompareColumns';
import CompareItem, { CompareHeaders } from './CompareItem';
import CompareSuggestions from './CompareSuggestions';
import { endCompareSession, removeCompareItem, updateCompareQuery } from './actions';
import { CompareSession } from './reducer';
import { compareItemsSelector, compareOrganizerLinkSelector } from './selectors';

export interface StatInfo {
  /** An example of the stat, used for its constant definition. */
  stat: DimStat;
  // TODO: Replace this max/min with a thing that walks over the rows and computes max/min over them?
  /** The minimum value of this stat across all items being compared. */
  min: number;
  /** The maximum value of this stat across all items being compared. */
  max: number;
  /** The minimum base value of this stat across all items being compared. */
  minBase: number;
  /** The maximum base value of this stat across all items being compared. */
  maxBase: number;
}

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
  const itemCreationContext = useSelector(createItemContextSelector);
  const rawCompareItems = useSelector(compareItemsSelector(session.vendorCharacterId));
  const organizerLink = useSelector(compareOrganizerLinkSelector);

  /** The stat row to highlight */
  const [highlight, setHighlight] = useState<string | number>();
  const [socketOverrides, onPlugClicked] = useSocketOverridesForItems();
  const [columnSorts, toggleColumnSort] = useTableColumnSorts([]);

  const comparingArmor = rawCompareItems[0]?.bucket.inArmor;
  const comparingWeapons = rawCompareItems[0]?.bucket.inWeapons;
  const doCompareBaseStats = Boolean(compareBaseStats && comparingArmor);
  const doAssumeWeaponMasterworks = Boolean(defs && assumeWeaponMasterwork && comparingWeapons);

  // Produce new items which have had their sockets changed
  const compareItems = useMemo(() => {
    let items = rawCompareItems;
    if (doAssumeWeaponMasterworks) {
      // Fully masterwork weapons
      items = items.map((i) => masterworkItem(i, itemCreationContext));
    }
    // Apply any socket override selections (perk choices)
    return items.map((i) => applySocketOverrides(itemCreationContext, i, socketOverrides[i.id]));
  }, [itemCreationContext, doAssumeWeaponMasterworks, rawCompareItems, socketOverrides]);

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

  // Memoize computing the list of stats
  const allStats = useMemo(() => getAllStats(compareItems), [compareItems]);

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

  /* ItemTable incursion */

  const destinyVersion = compareItems[0].destinyVersion;
  const type = comparingArmor ? 'armor' : comparingWeapons ? 'weapon' : 'ghost';
  const columns: ColumnDefinition[] = useMemo(
    () =>
      getColumns(
        type,
        allStats,
        itemCreationContext.customStats,
        destinyVersion,
        doCompareBaseStats,
      ),
    [type, allStats, doCompareBaseStats, destinyVersion, itemCreationContext.customStats],
  );

  // TODO: Filter to enabled columns
  const filteredColumns = columns;

  // process items into Rows
  const unsortedRows: Row[] = useMemo(
    () => buildRows(compareItems, filteredColumns),
    [filteredColumns, compareItems],
  );
  const language = useSelector(languageSelector);
  const rows = useMemo(
    () =>
      sortRows(unsortedRows, columnSorts, filteredColumns, language, (a, b) =>
        chainComparator(
          compareBy((item) => item.id !== session.initialItemId),
          acquisitionRecencyComparator,
        )(a.item, b.item),
      ),
    [unsortedRows, columnSorts, filteredColumns, language, session.initialItemId],
  );

  /* End ItemTable incursion */

  // TODO: once we stop displaying CompareItems at all, we can drop this
  const sortedComparisonItems = useMemo(
    () => compareItems.toSorted(compareBy((i) => rows.findIndex((r) => r.item === i))),
    [compareItems, rows],
  );

  // If the session was started with a specific item, this is it
  const initialItem = session.initialItemId
    ? compareItems.find((i) => i.id === session.initialItemId)
    : undefined;
  const firstCompareItem = sortedComparisonItems[0];
  // The example item is the one we'll use for generating suggestion buttons
  const exampleItem = initialItem || firstCompareItem;

  const items = useMemo(
    () => (
      <CompareItems
        items={sortedComparisonItems}
        rows={rows}
        filteredColumns={filteredColumns}
        remove={remove}
        setHighlight={setHighlight}
        onPlugClicked={onPlugClicked}
        initialItemId={session.initialItemId}
      />
    ),
    [sortedComparisonItems, rows, filteredColumns, remove, onPlugClicked, session.initialItemId],
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
        <CompareHeaders
          columnSorts={columnSorts}
          highlight={highlight}
          setHighlight={setHighlight}
          toggleColumnSort={toggleColumnSort}
          filteredColumns={filteredColumns}
        />
        {items}
      </div>
    </Sheet>
  );
}

function CompareItems({
  items,
  rows,
  filteredColumns,
  remove,
  setHighlight,
  onPlugClicked,
  initialItemId,
}: {
  initialItemId: string | undefined;
  rows: Row[];
  filteredColumns: ColumnDefinition[];
  items: DimItem[];
  remove: (item: DimItem) => void;
  setHighlight: React.Dispatch<React.SetStateAction<string | number | undefined>>;
  onPlugClicked: (value: { item: DimItem; socket: DimSocket; plugHash: number }) => void;
}) {
  return (
    <SheetHorizontalScrollContainer>
      {items.map((item) => (
        <CompareItem
          item={item}
          row={rows.find((r) => r.item === item)!}
          filteredColumns={filteredColumns}
          key={item.id}
          itemClick={locateItem}
          remove={remove}
          setHighlight={setHighlight}
          onPlugClicked={onPlugClicked}
          isInitialItem={initialItemId === item.id}
        />
      ))}
    </SheetHorizontalScrollContainer>
  );
}

// TODO: Combine with ItemTable.buildStatInfo
function getAllStats(comparisonItems: DimItem[]): StatInfo[] {
  if (!comparisonItems.length) {
    return emptyArray<StatInfo>();
  }

  const statsByHash: { [statHash: string]: StatInfo } = {};
  for (const item of comparisonItems) {
    if (item.stats) {
      for (const stat of item.stats) {
        let statInfo = statsByHash[stat.statHash];
        if (statInfo) {
          statInfo.min = Math.min(statInfo.min, stat.value);
          statInfo.max = Math.max(statInfo.max, stat.value);
          statInfo.minBase = Math.min(statInfo.minBase, stat.base);
          statInfo.maxBase = Math.max(statInfo.minBase, stat.base);
        } else {
          statInfo = {
            stat,
            min: stat.value,
            max: stat.value,
            minBase: stat.base,
            maxBase: stat.base,
          };
          statsByHash[stat.statHash] = statInfo;
        }
      }
    }
  }
  return Object.values(statsByHash);
}

/**
 * Produce a copy of the item with the masterwork socket filled in with the best
 * masterwork option.
 */
function masterworkItem(i: DimItem, itemCreationContext: ItemCreationContext): DimItem {
  const y2MasterworkSocket = i.sockets?.allSockets.find(
    (socket) => socket.socketDefinition.socketTypeHash === weaponMasterworkY2SocketTypeHash,
  );
  const plugSet = y2MasterworkSocket?.plugSet;
  const plugged = y2MasterworkSocket?.plugged;
  if (plugSet && plugged) {
    const fullMasterworkPlug = maxBy(
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
}
