import * as React from 'react';
import { DimItem, DimTalentGrid } from '../inventory/item-types';
import { IScope } from 'angular';
import ItemTagSelector from '../move-popup/ItemTagSelector';
import { AppIcon, searchIcon } from '../shell/icons';
import ConnectedInventoryItem from '../inventory/ConnectedInventoryItem';
import Sockets from '../move-popup/Sockets';
import { StatInfo } from './Compare';
import { angular2react } from 'angular2react';
import { TalentGridComponent } from '../move-popup/talent-grid.component';
import { lazyInjector } from '../../lazyInjector';
import CompareStat from './CompareStat';
import { InventoryCuratedRoll } from '../curated-rolls/curatedRollService';

const TalentGrid = angular2react<{
  talentGrid: DimTalentGrid;
  perksOnly: boolean;
}>('dimTalentGrid', TalentGridComponent, lazyInjector.$injector as angular.auto.IInjectorService);

export default function CompareItem({
  item,
  stats,
  $scope,
  itemClick,
  remove,
  highlight,
  curationEnabled,
  inventoryCuratedRoll,
  setHighlight
}: {
  item: DimItem;
  stats: StatInfo[];
  $scope: IScope;
  highlight: number | string | undefined;
  curationEnabled: boolean;
  inventoryCuratedRoll: InventoryCuratedRoll;
  itemClick(item: DimItem): void;
  remove(item: DimItem): void;
  setHighlight(value?: string | number): void;
}) {
  return (
    <div className="compare-item">
      <div className="compare-item-header">
        <ItemTagSelector item={item} />
        <div className="close" onClick={() => remove(item)} />
      </div>
      <div className="item-name" onClick={() => itemClick(item)}>
        {item.name} <AppIcon icon={searchIcon} />
      </div>
      <ConnectedInventoryItem item={item} />
      {stats.map((stat) => (
        <CompareStat
          key={stat.id}
          item={item}
          stat={stat}
          setHighlight={setHighlight}
          highlight={highlight}
        />
      ))}
      {item.talentGrid && <TalentGrid talentGrid={item.talentGrid} perksOnly={true} />}
      {item.isDestiny2() && item.sockets && (
        <Sockets
          item={item}
          $scope={$scope}
          curationEnabled={curationEnabled}
          inventoryCuratedRoll={inventoryCuratedRoll}
        />
      )}
    </div>
  );
}
