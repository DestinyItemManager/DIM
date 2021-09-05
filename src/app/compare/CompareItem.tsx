import { t } from 'app/i18next-t';
import ItemPopupTrigger from 'app/inventory/ItemPopupTrigger';
import { moveItemTo } from 'app/inventory/move-item';
import { currentStoreSelector } from 'app/inventory/selectors';
import ActionButton from 'app/item-actions/ActionButton';
import { LockActionButton, TagActionButton } from 'app/item-actions/ActionButtons';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import { useSetCSSVarToHeight } from 'app/utils/hooks';
import clsx from 'clsx';
import React, { useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';
import ConnectedInventoryItem from '../inventory/ConnectedInventoryItem';
import { DimItem, DimPlug, DimSocket } from '../inventory/item-types';
import ItemSockets from '../item-popup/ItemSockets';
import ItemTalentGrid from '../item-popup/ItemTalentGrid';
import { AppIcon, faArrowCircleDown, searchIcon } from '../shell/icons';
import { StatInfo } from './Compare';
import styles from './CompareItem.m.scss';
import CompareStat from './CompareStat';
import { DimAdjustedItemPlug, DimAdjustedItemStat } from './types';

export default function CompareItem({
  item,
  stats,
  compareBaseStats,
  itemClick,
  remove,
  highlight,
  setHighlight,
  updateSocketComparePlug,
  adjustedItemPlugs,
  adjustedItemStats,
  isInitialItem,
}: {
  item: DimItem;
  stats: StatInfo[];
  compareBaseStats?: boolean;
  highlight: number | string | undefined;
  itemClick(item: DimItem): void;
  remove(item: DimItem): void;
  setHighlight(value?: string | number): void;
  updateSocketComparePlug(value: { item: DimItem; socket: DimSocket; plug: DimPlug }): void;
  adjustedItemPlugs?: DimAdjustedItemPlug;
  adjustedItemStats?: DimAdjustedItemStat;
  isInitialItem: boolean;
}) {
  const headerRef = useRef<HTMLDivElement>(null);
  useSetCSSVarToHeight(headerRef, '--compare-item-height');

  const dispatch = useThunkDispatch();
  const currentStore = useSelector(currentStoreSelector)!;
  const pullItem = () => {
    dispatch(moveItemTo(item, currentStore, false));
  };

  const itemHeader = useMemo(
    () => (
      <div ref={headerRef}>
        <div className={styles.header}>
          <ActionButton onClick={pullItem}>
            <AppIcon icon={faArrowCircleDown} />
          </ActionButton>
          <LockActionButton item={item} />
          <TagActionButton item={item} label={false} hideKeys={true} />
          <div className={styles.close} onClick={() => remove(item)} role="button" tabIndex={0} />
        </div>
        <div
          className={clsx(styles.itemName, { [styles.initialItem]: isInitialItem })}
          title={isInitialItem ? t('Compare.InitialItem') : undefined}
          onClick={() => itemClick(item)}
        >
          {item.name} <AppIcon icon={searchIcon} />
        </div>
        <ItemPopupTrigger item={item} noCompare={true}>
          {(ref, onClick) => (
            <div className={styles.itemAside} ref={ref} onClick={onClick}>
              <ConnectedInventoryItem item={item} />
            </div>
          )}
        </ItemPopupTrigger>
      </div>
    ),
    [isInitialItem, item, itemClick, remove]
  );

  return (
    <div className="compare-item">
      {itemHeader}
      {stats.map((stat) => (
        <CompareStat
          key={stat.id}
          item={item}
          stat={stat}
          setHighlight={setHighlight}
          highlight={highlight}
          adjustedItemStats={adjustedItemStats}
          compareBaseStats={compareBaseStats}
        />
      ))}
      {item.talentGrid && <ItemTalentGrid item={item} perksOnly={true} />}
      {item.missingSockets && (
        <div className="item-details warning">{t('MovePopup.MissingSockets')}</div>
      )}
      {item.sockets && (
        <ItemSockets
          item={item}
          minimal={true}
          updateSocketComparePlug={updateSocketComparePlug}
          adjustedItemPlugs={adjustedItemPlugs}
        />
      )}
    </div>
  );
}
