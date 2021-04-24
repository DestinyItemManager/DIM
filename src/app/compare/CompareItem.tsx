import PressTip from 'app/dim-ui/PressTip';
import { t } from 'app/i18next-t';
import { getNotes } from 'app/inventory/dim-item-info';
import { itemInfosSelector } from 'app/inventory/selectors';
import { LockActionButton, TagActionButton } from 'app/item-actions/ActionButtons';
import clsx from 'clsx';
import React from 'react';
import { useSelector } from 'react-redux';
import ConnectedInventoryItem from '../inventory/ConnectedInventoryItem';
import { DimItem, DimPlug, DimSocket } from '../inventory/item-types';
import ItemSockets from '../item-popup/ItemSockets';
import ItemTalentGrid from '../item-popup/ItemTalentGrid';
import { AppIcon, searchIcon } from '../shell/icons';
import { StatInfo } from './Compare';
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
  const itemInfos = useSelector(itemInfosSelector);
  const itemNotes = getNotes(item, itemInfos);
  return (
    <div className="compare-item">
      <div className="compare-item-header">
        <LockActionButton item={item} />
        <TagActionButton item={item} label={true} hideKeys={true} />
        <div className="close" onClick={() => remove(item)} />
      </div>
      <div
        className={clsx('item-name', { 'compare-initial-item': isInitialItem })}
        onClick={() => itemClick(item)}
      >
        {item.name} <AppIcon icon={searchIcon} />
      </div>
      <PressTip
        elementType="span"
        className="itemAside"
        tooltip={itemNotes}
        allowClickThrough={true}
      >
        <ConnectedInventoryItem item={item} onClick={() => itemClick(item)} />
      </PressTip>
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
