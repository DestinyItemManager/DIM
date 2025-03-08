import BungieImage from 'app/dim-ui/BungieImage';
import { PressTip } from 'app/dim-ui/PressTip';
import { useDynamicStringReplacer } from 'app/dim-ui/destiny-symbols/RichDestinyText';
import { ColumnSort, SortDirection } from 'app/dim-ui/table-columns';
import { t, tl } from 'app/i18next-t';
import ItemPopupTrigger from 'app/inventory/ItemPopupTrigger';
import { moveItemTo } from 'app/inventory/move-item';
import { currentStoreSelector, notesSelector } from 'app/inventory/selectors';
import ActionButton from 'app/item-actions/ActionButton';
import { LockActionButton, TagActionButton } from 'app/item-actions/ActionButtons';
import { useD2Definitions } from 'app/manifest/selectors';
import { statLabels } from 'app/organizer/Columns';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import { noop } from 'app/utils/functions';
import { useSetCSSVarToHeight, useShiftHeld } from 'app/utils/hooks';
import { isD1Item } from 'app/utils/item-utils';
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
import styles from './CompareItem.m.scss';
import CompareStat from './CompareStat';

export default memo(function CompareItem({
  item,
  stats,
  compareBaseStats,
  itemClick,
  remove,
  setHighlight,
  onPlugClicked,
  isInitialItem,
}: {
  item: DimItem;
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
        <div
          className={clsx(styles.itemName, {
            [styles.initialItem]: isInitialItem,
            [styles.isFindable]: isFindable,
          })}
          onClick={() => itemClick(item)}
        >
          <span title={isInitialItem ? t('Compare.InitialItem') : undefined}>{item.name}</span>
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

  return (
    <div className={styles.compareItem}>
      {itemHeader}
      {stats.map((stat) => (
        <CompareStat
          key={stat.stat.statHash}
          item={item}
          stat={stat}
          setHighlight={setHighlight}
          compareBaseStats={compareBaseStats}
        />
      ))}
      {isD1Item(item) && item.talentGrid && (
        <ItemTalentGrid item={item} className={styles.talentGrid} perksOnly={true} />
      )}
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

/** The row headers that appear on the left of the compare window */
export function CompareHeaders({
  columnSorts,
  highlight,
  setHighlight,
  toggleColumnSort,
  allStats,
}: {
  columnSorts: ColumnSort[];
  highlight: string | number | undefined;
  setHighlight: React.Dispatch<React.SetStateAction<string | number | undefined>>;
  toggleColumnSort: (columnId: string, shiftHeld: boolean, sort?: SortDirection) => () => void;
  allStats: StatInfo[];
}) {
  const isShiftHeld = useShiftHeld();
  return (
    <div className={styles.statList}>
      <div className={styles.spacer} />
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
