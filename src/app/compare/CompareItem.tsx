import React from 'react';
import ConnectedInventoryItem from '../inventory/ConnectedInventoryItem';
import { DimItem, DimPlug, DimSocket } from '../inventory/item-types';
import ItemSockets from '../item-popup/ItemSockets';
import ItemTagSelector from '../item-popup/ItemTagSelector';
import ItemTalentGrid from '../item-popup/ItemTalentGrid';
import LockButton from '../item-popup/LockButton';
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
}) {
  return (
    <div className="compare-item">
      <div className="compare-item-header">
        <div className="icon comp-lock-icon">
          {item.lockable && <LockButton item={item} type="lock" />}
          {item.trackable && <LockButton item={item} type="track" />}
        </div>
        <ItemTagSelector item={item} className="tagSelector" hideKeys={true} />
        <div className="close" onClick={() => remove(item)} />
      </div>
      <div className="item-name" onClick={() => itemClick(item)}>
        {item.name} <AppIcon icon={searchIcon} />
      </div>
      <ConnectedInventoryItem item={item} onClick={() => itemClick(item)} />
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
