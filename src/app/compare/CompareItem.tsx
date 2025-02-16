import BungieImage from 'app/dim-ui/BungieImage';
import { PressTip } from 'app/dim-ui/PressTip';
import { useDynamicStringReplacer } from 'app/dim-ui/destiny-symbols/RichDestinyText';
import { t, tl } from 'app/i18next-t';
import ItemPopupTrigger from 'app/inventory/ItemPopupTrigger';
import { moveItemTo } from 'app/inventory/move-item';
import { currentStoreSelector, notesSelector } from 'app/inventory/selectors';
import ActionButton from 'app/item-actions/ActionButton';
import { LockActionButton, TagActionButton } from 'app/item-actions/ActionButtons';
import { useD2Definitions } from 'app/manifest/selectors';
import { statLabels } from 'app/organizer/Columns';
import { ColumnDefinition, ColumnSort, Row, SortDirection } from 'app/organizer/table-types';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import { noop } from 'app/utils/functions';
import { useSetCSSVarToHeight, useShiftHeld } from 'app/utils/hooks';
import { isD1Item } from 'app/utils/item-utils';
import { StringLookup } from 'app/utils/util-types';
import clsx from 'clsx';
import { StatHashes } from 'data/d2/generated-enums';
import { memo, useCallback, useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router';
import ConnectedInventoryItem from '../inventory/ConnectedInventoryItem';
import { DimItem, DimSocket } from '../inventory/item-types';
import ItemSockets from '../item-popup/ItemSockets';
import ItemTalentGrid from '../item-popup/ItemTalentGrid';
import {
  AppIcon,
  faAngleLeft,
  faAngleRight,
  faArrowCircleDown,
  shoppingCart,
} from '../shell/icons';
import { StatInfo } from './Compare';
import styles from './CompareItem.m.scss'; // eslint-disable-line css-modules/no-unused-class
import CompareStat from './CompareStat';

const possibleStyles = styles as unknown as StringLookup<string>;

export default memo(function CompareItem({
  item,
  row,
  filteredColumns,
  stats,
  compareBaseStats,
  itemClick,
  remove,
  setHighlight,
  onPlugClicked,
  isInitialItem,
}: {
  item: DimItem;
  row: Row;
  filteredColumns: ColumnDefinition[];
  stats: StatInfo[];
  compareBaseStats?: boolean;
  itemClick: (item: DimItem) => void;
  remove: (item: DimItem) => void;
  setHighlight: (value?: string | number) => void;
  onPlugClicked: (value: { item: DimItem; socket: DimSocket; plugHash: number }) => void;
  isInitialItem: boolean;
}) {
  const headerRef = useRef<HTMLDivElement>(null);
  useSetCSSVarToHeight(headerRef, '--compare-item-height');
  const itemNotes = useSelector(notesSelector(item));
  const dispatch = useThunkDispatch();
  const currentStore = useSelector(currentStoreSelector)!;
  const pullItem = useCallback(() => {
    dispatch(moveItemTo(item, currentStore, false));
  }, [currentStore, dispatch, item]);

  const { pathname } = useLocation();
  const isFindable = !item.vendor && pathname.endsWith('/inventory');

  const itemHeader = useMemo(
    () => (
      <div ref={headerRef}>
        <div className={styles.header}>
          {item.vendor ? (
            <VendorItemWarning item={item} />
          ) : (
            <ActionButton title={t('Hotkey.Pull')} onClick={pullItem}>
              <AppIcon icon={faArrowCircleDown} />
            </ActionButton>
          )}
          {item.lockable ? <LockActionButton item={item} noHotkey /> : <div />}
          {item.taggable ? <TagActionButton item={item} label={false} hideKeys={true} /> : <div />}
          <button type="button" className={styles.close} onClick={() => remove(item)} />
        </div>
        <ItemPopupTrigger item={item} noCompare={true}>
          {(ref, onClick) => (
            <div className={styles.itemAside} ref={ref} onClick={onClick}>
              <PressTip minimal tooltip={itemNotes}>
                <ConnectedInventoryItem item={item} />
              </PressTip>
            </div>
          )}
        </ItemPopupTrigger>
      </div>
    ),
    [isInitialItem, item, itemClick, pullItem, remove, itemNotes, isFindable],
  );

  const missingSocketsMessage =
    item.missingSockets === 'missing'
      ? tl('MovePopup.MissingSockets')
      : tl('MovePopup.LoadingSockets');

  const handleRowClick = (row: Row, column: ColumnDefinition) => {
    if (column.id === 'name' && isFindable) {
      return () => itemClick(row.item);
    }
    return () => console.log('clicked', row, column);
  };

  return (
    <div
      className={clsx(styles.compareItem, {
        [styles.initialItem]: isInitialItem,
        [styles.isFindable]: isFindable,
      })}
    >
      {itemHeader}
      <TableRow
        row={row}
        filteredColumns={filteredColumns}
        onRowClick={handleRowClick}
        setHighlight={setHighlight}
      />
      {stats.map((stat) => (
        <CompareStat
          key={stat.stat.statHash}
          item={item}
          stat={stat}
          setHighlight={setHighlight}
          compareBaseStats={compareBaseStats}
        />
      ))}
      {isD1Item(item) && item.talentGrid && <ItemTalentGrid item={item} perksOnly={true} />}
      {item.missingSockets && isInitialItem && (
        <div className="item-details warning">{t(missingSocketsMessage)}</div>
      )}
      {item.sockets && <ItemSockets item={item} minimal onPlugClicked={onPlugClicked} />}
    </div>
  );
});

function VendorItemWarning({ item }: { item: DimItem }) {
  const defs = useD2Definitions()!;
  const replacer = useDynamicStringReplacer(item.owner);
  return item.vendor ? (
    <PressTip
      elementType="span"
      tooltip={() => {
        const vendorName =
          replacer(defs.Vendor.get(item.vendor!.vendorHash)?.displayProperties?.name) || '--';
        return <>{t('Compare.IsVendorItem', { vendorName })}</>;
      }}
    >
      <ActionButton onClick={noop} disabled>
        <AppIcon icon={shoppingCart} />
      </ActionButton>
    </PressTip>
  ) : null;
}

// Copied from ItemTable - TODO: reconverge
function TableRow({
  row,
  filteredColumns,
  onRowClick,
  setHighlight,
}: {
  row: Row;
  filteredColumns: ColumnDefinition[];
  onRowClick: (
    row: Row,
    column: ColumnDefinition,
  ) => ((event: React.MouseEvent<HTMLTableCellElement>) => void) | undefined;
  setHighlight: React.Dispatch<React.SetStateAction<string | number | undefined>>;
}) {
  // TODO: reintroduce styles per column?

  return (
    <>
      {filteredColumns.map((column) => {
        const isStatsColumn = ['stats', 'baseStats'].includes(column.columnGroup?.id ?? '');
        return (
          // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
          <div
            key={column.id}
            onClick={onRowClick(row, column)}
            className={clsx(possibleStyles[column.id], {
              // [styles.hasFilter]: column.filter !== undefined,
              // [styles.customstat]: column.id.startsWith('customstat_'),
              [styles.stats]: isStatsColumn,
            })}
            role="cell"
            onPointerEnter={() => setHighlight(column.id)}
          >
            {column.cell ? column.cell(row.values[column.id], row.item) : row.values[column.id]}
          </div>
        );
      })}
    </>
  );
}

export function CompareHeaders({
  allStats,
  columnSorts,
  highlight,
  setHighlight,
  toggleColumnSort,
  filteredColumns,
}: {
  allStats: StatInfo[];
  columnSorts: ColumnSort[];
  highlight: string | number | undefined;
  setHighlight: React.Dispatch<React.SetStateAction<string | number | undefined>>;
  toggleColumnSort: (columnId: string, shiftHeld: boolean, sort?: SortDirection) => () => void;
  filteredColumns: ColumnDefinition[];
}) {
  const isShiftHeld = useShiftHeld();
  return (
    <div className={styles.statList}>
      <div className={styles.spacer} />
      {filteredColumns.map((column) => {
        const columnSort = !column.noSort && columnSorts.find((c) => c.columnId === column.id);
        const isStatsColumn = ['stats', 'baseStats'].includes(column.columnGroup?.id ?? '');
        return (
          <div
            key={column.id}
            className={clsx(
              styles.statLabel,
              possibleStyles[column.id],
              // column.id.startsWith('customstat_') && styles.customstat,
              {
                [styles.stats]: isStatsColumn,
              },
              columnSort
                ? columnSort.sort === SortDirection.ASC
                  ? styles.sortDesc
                  : styles.sortAsc
                : undefined,
            )}
            onPointerEnter={() => setHighlight(column.id)}
            onClick={
              column.noSort
                ? undefined
                : toggleColumnSort(column.id, isShiftHeld, column.defaultSort)
            }
          >
            {column.header}{' '}
            {columnSort && (
              <AppIcon icon={columnSort.sort === SortDirection.ASC ? faAngleRight : faAngleLeft} />
            )}
            {column.id === highlight && <div className={styles.highlightBar} />}
          </div>
        );
      })}
      {allStats.map((s) => {
        const columnSort = columnSorts.find((c) => c.columnId === s.stat.statHash.toString());
        return (
          <div
            key={s.stat.statHash}
            className={clsx(
              styles.statLabel,
              columnSort
                ? columnSort.sort === SortDirection.ASC
                  ? styles.sortDesc
                  : styles.sortAsc
                : undefined,
            )}
            onPointerEnter={() => setHighlight(s.stat.statHash)}
            onClick={toggleColumnSort(
              s.stat.statHash.toString(),
              isShiftHeld,
              s.stat.smallerIsBetter ? SortDirection.DESC : SortDirection.ASC,
            )}
          >
            {s.stat.displayProperties.hasIcon && (
              <span title={s.stat.displayProperties.name}>
                <BungieImage src={s.stat.displayProperties.icon} />
              </span>
            )}
            {s.stat.statHash in statLabels
              ? t(statLabels[s.stat.statHash as StatHashes]!)
              : s.stat.displayProperties.name}{' '}
            {columnSort && (
              <AppIcon icon={columnSort.sort === SortDirection.ASC ? faAngleRight : faAngleLeft} />
            )}
            {s.stat.statHash === highlight && <div className={styles.highlightBar} />}
          </div>
        );
      })}
    </div>
  );
}
