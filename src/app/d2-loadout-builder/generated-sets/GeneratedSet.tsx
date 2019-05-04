import React from 'react';
import { DimStore } from '../../inventory/store-types';
import { dimLoadoutService, Loadout } from '../../loadout/loadout.service';
import { ArmorSet, LockedItemType, StatTypes } from '../types';
import GeneratedSetButtons from './GeneratedSetButtons';
import GeneratedSetItem from './GeneratedSetItem';
import { powerIndicatorIcon, AppIcon } from '../../shell/icons';
import _ from 'lodash';
import { getPower, getNumValidSets, getFirstValidSet } from './utils';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions.service';
import BungieImage from 'app/dim-ui/BungieImage';
import { DestinyStatDefinition } from 'bungie-api-ts/destiny2';
import { statHashes } from '../process';

export default function GeneratedSet({
  set,
  selectedStore,
  lockedMap,
  toggleLockedItem,
  style,
  statOrder,
  defs
}: {
  set: ArmorSet;
  selectedStore?: DimStore;
  lockedMap: Readonly<{ [bucketHash: number]: readonly LockedItemType[] }>;
  style: React.CSSProperties;
  statOrder: StatTypes[];
  defs: D2ManifestDefinitions;
  toggleLockedItem(lockedItem: LockedItemType): void;
}) {
  // Set the loadout property to show/hide the loadout menu
  const setCreateLoadout = (loadout: Loadout) => {
    dimLoadoutService.editLoadout(loadout, { showClass: false });
  };

  const numSets = getNumValidSets(set);
  if (!numSets) {
    return null;
  }
  const firstValidSet = getFirstValidSet(set);
  if (!firstValidSet) {
    return null;
  }

  const stats = {
    Mobility: defs.Stat.get(statHashes.Mobility),
    Resilience: defs.Stat.get(statHashes.Resilience),
    Recovery: defs.Stat.get(statHashes.Recovery)
  };

  return (
    <div className="generated-build" style={style}>
      <div className="generated-build-header">
        <div>
          {/* TODO: allow sorting stats?? */}
          <span>
            <b>{`T${set.stats.Mobility + set.stats.Resilience + set.stats.Recovery}`}</b> |{' '}
            {statOrder.map((stat) => (
              <Stat key={stat} stat={stats[stat]} value={set.stats[stat]} />
            ))}
          </span>
          <span className="light">
            <AppIcon icon={powerIndicatorIcon} /> {getPower(set)}
          </span>
        </div>

        <GeneratedSetButtons
          numSets={numSets}
          set={set}
          store={selectedStore!}
          onLoadoutSet={setCreateLoadout}
        />
      </div>
      <div className="sub-bucket">
        {firstValidSet.map((item, index) => (
          <GeneratedSetItem
            key={item.index}
            item={item}
            locked={lockedMap[item.bucket.hash]}
            onExclude={toggleLockedItem}
            statValues={set.statChoices[index]}
          />
        ))}
      </div>
    </div>
  );
}

function Stat({ stat, value }: { stat: DestinyStatDefinition; value: number }) {
  return (
    <span title={stat.displayProperties.description}>
      <b>{value}</b> <BungieImage src={stat.displayProperties.icon} /> {stat.displayProperties.name}
    </span>
  );
}
