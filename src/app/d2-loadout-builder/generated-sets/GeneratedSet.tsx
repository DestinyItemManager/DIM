import { t } from 'app/i18next-t';
import React from 'react';
import { DimStore } from '../../inventory/store-types';
import { dimLoadoutService, Loadout } from '../../loadout/loadout.service';
import { ArmorSet, LockedItemType } from '../types';
import GeneratedSetButtons from './GeneratedSetButtons';
import GeneratedSetItem from './GeneratedSetItem';
import { powerIndicatorIcon, AppIcon } from '../../shell/icons';
import _ from 'lodash';
import { getPower, getNumValidSets, getFirstValidSet } from './utils';

export default function GeneratedSet({
  set,
  selectedStore,
  lockedMap,
  toggleLockedItem,
  style
}: {
  set: ArmorSet;
  selectedStore?: DimStore;
  lockedMap: { [bucketHash: number]: LockedItemType[] };
  style: React.CSSProperties;
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

  return (
    <div className="generated-build" style={style}>
      <div className="generated-build-header">
        <div>
          {/* TODO: use stat icons */}
          {/* TODO: allow sorting stats?? */}
          <span>
            {`T${set.stats.Mobility + set.stats.Resilience + set.stats.Recovery} | ${t(
              'LoadoutBuilder.Mobility'
            )} ${set.stats.Mobility} | ${t('LoadoutBuilder.Resilience')} ${
              set.stats.Resilience
            } | ${t('LoadoutBuilder.Recovery')} ${set.stats.Recovery}`}
          </span>
          <span className="light">
            <AppIcon icon={powerIndicatorIcon} /> {getPower(set)}
          </span>{' '}
          <span>{numSets.toLocaleString()} sets with this mix</span>
        </div>

        <GeneratedSetButtons set={set} store={selectedStore!} onLoadoutSet={setCreateLoadout} />
      </div>
      <div className="sub-bucket">
        {firstValidSet.map((item) => (
          <GeneratedSetItem
            key={item.index}
            item={item}
            locked={lockedMap[item.bucket.hash]}
            onExclude={toggleLockedItem}
          />
        ))}
      </div>
    </div>
  );
}
