import { CustomStatDef } from '@destinyitemmanager/dim-api-types';
import { languageSelector } from 'app/dim-api/selectors';
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
import { buildStatInfo } from 'app/organizer/Columns';
import { buildRows, sortRows } from 'app/organizer/ItemTable';
import { ColumnDefinition, Row, TableContext } from 'app/organizer/table-types';
import { weaponMasterworkY2SocketTypeHash } from 'app/search/d2-known-values';
import Checkbox from 'app/settings/Checkbox';
import { useSetting } from 'app/settings/hooks';
import { AppIcon, faList } from 'app/shell/icons';
import { acquisitionRecencyComparator } from 'app/shell/item-comparators';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import { compact } from 'app/utils/collections';
import { emptyArray } from 'app/utils/empty';
import { maxBy } from 'es-toolkit';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router';
import Sheet from '../dim-ui/Sheet';
import { DimItem, DimSocket } from '../inventory/item-types';
import { chainComparator, compareBy } from '../utils/comparators';
import styles from './Compare.m.scss';
import { getColumns } from './CompareColumns';
import CompareItem, { CompareHeaders } from './CompareItem';
import CompareSuggestions from './CompareSuggestions';
import { endCompareSession, removeCompareItem, updateCompareQuery } from './actions';
import { CompareSession } from './reducer';
import { compareItemsSelector, compareOrganizerLinkSelector } from './selectors';

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
    if (doAssumeWeaponMasterworks && comparingWeapons) {
      // Fully masterwork weapons
      items = items.map((i) => masterworkItem(i, itemCreationContext));
    }
    // Apply any socket override selections (perk choices)
    return items.map((i) => applySocketOverrides(itemCreationContext, i, socketOverrides[i.id]));
  }, [
    itemCreationContext,
    doAssumeWeaponMasterworks,
    rawCompareItems,
    socketOverrides,
    comparingWeapons,
  ]);

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
  const allStats = useMemo(() => buildStatInfo(compareItems), [compareItems]);

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

  // If the session was started with a specific item, this is it
  const initialItem = session.initialItemId
    ? compareItems.find((i) => i.id === session.initialItemId)
    : undefined;

  /* ItemTable incursion */

  const destinyVersion = compareItems[0]?.destinyVersion ?? 2;
  const type = comparingArmor ? 'armor' : comparingWeapons ? 'weapon' : 'general';
  const hasEnergy = compareItems.some((i) => i.energy);
  const primaryStatDescription =
    (!comparingArmor &&
      !comparingWeapons &&
      compareItems.find((i) => i.primaryStat)?.primaryStatDisplayProperties) ||
    undefined;

  const customStats = comparingArmor
    ? itemCreationContext.customStats
    : emptyArray<CustomStatDef>();

  const columns: ColumnDefinition[] = useMemo(
    () =>
      getColumns(
        type,
        hasEnergy,
        allStats,
        customStats,
        destinyVersion,
        doCompareBaseStats,
        primaryStatDescription,
        initialItem?.id,
        onPlugClicked,
      ),
    [
      type,
      hasEnergy,
      allStats,
      doCompareBaseStats,
      destinyVersion,
      customStats,
      primaryStatDescription,
      initialItem?.id,
      onPlugClicked,
    ],
  );

  const classIfAny = comparingArmor ? compareItems[0]?.classType : undefined;
  const filteredColumns = useMemo(
    () =>
      // TODO: filter to enabled columns once you can select columns
      compact(
        columns.filter(
          (column) => column.limitToClass === undefined || column.limitToClass === classIfAny,
        ),
      ),
    [columns, classIfAny],
  );

  // process items into Rows
  const [unsortedRows, tableCtx] = useMemo(
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

  const firstCompareItem = rows[0]?.item;
  // The example item is the one we'll use for generating suggestion buttons
  const exampleItem = initialItem || firstCompareItem;

  const items = useMemo(
    () => (
      <CompareItems
        rows={rows}
        tableCtx={tableCtx}
        filteredColumns={filteredColumns}
        remove={remove}
        setHighlight={setHighlight}
        onPlugClicked={onPlugClicked}
      />
    ),
    [rows, tableCtx, filteredColumns, remove, onPlugClicked],
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
      {comparingWeapons && defs && destinyVersion === 2 && (
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

  const gridSpec = `min-content ${filteredColumns
    .map((c) => c.gridWidth ?? 'min-content')
    .join(' ')}`;
  return (
    <Sheet onClose={cancel} header={header} allowClickThrough>
      <div className={styles.scroller}>
        <div
          className={styles.bucket}
          style={{ gridTemplateRows: gridSpec }}
          onPointerLeave={() => setHighlight(undefined)}
        >
          <CompareHeaders
            columnSorts={columnSorts}
            highlight={highlight}
            setHighlight={setHighlight}
            toggleColumnSort={toggleColumnSort}
            filteredColumns={filteredColumns}
          />
          {items}
        </div>
      </div>
    </Sheet>
  );
}

function CompareItems({
  rows,
  tableCtx,
  filteredColumns,
  remove,
  setHighlight,
  onPlugClicked,
}: {
  rows: Row[];
  tableCtx: TableContext;
  filteredColumns: ColumnDefinition[];
  remove: (item: DimItem) => void;
  setHighlight: React.Dispatch<React.SetStateAction<string | number | undefined>>;
  onPlugClicked: (value: { item: DimItem; socket: DimSocket; plugHash: number }) => void;
}) {
  return rows.map((row) => (
    <CompareItem
      item={row.item}
      row={row}
      tableCtx={tableCtx}
      filteredColumns={filteredColumns}
      key={row.item.id}
      itemClick={locateItem}
      remove={remove}
      setHighlight={setHighlight}
      onPlugClicked={onPlugClicked}
    />
  ));
}

/**
 * Produce a copy of the item with the masterwork socket filled in with the best
 * masterwork option.
 */
function masterworkItem(i: DimItem, itemCreationContext: ItemCreationContext): DimItem {
  if (i.destinyVersion !== 2 || !i.sockets) {
    return i;
  }
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
