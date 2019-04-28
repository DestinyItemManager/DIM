import { t } from 'app/i18next-t';
import React from 'react';
import { DimStore } from '../../inventory/store-types';
import { dimLoadoutService, Loadout } from '../../loadout/loadout.service';
import { ArmorSet, LockedItemType } from '../types';
import GeneratedSetButtons from './GeneratedSetButtons';
import GeneratedSetItem from './GeneratedSetItem';

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

  return (
    <div className="generated-build" style={style}>
      <div className="generated-build-header">
        <div>
          {/* TODO: use stat icons */}
          <span>
            {`T${set.stats.Mobility + set.stats.Resilience + set.stats.Recovery} | ${t(
              'LoadoutBuilder.Mobility'
            )} ${set.stats.Mobility} | ${t('LoadoutBuilder.Resilience')} ${
              set.stats.Resilience
            } | ${t('LoadoutBuilder.Recovery')} ${set.stats.Recovery}`}
          </span>
          <span className="light">
            {/*<AppIcon icon={powerIndicatorIcon} /> {set.power / set.armor.length}*/}
          </span>
        </div>

        <GeneratedSetButtons set={set} store={selectedStore!} onLoadoutSet={setCreateLoadout} />
      </div>
      <div className="sub-bucket">
        {set.armor.map((item) => (
          <GeneratedSetItem
            key={item[0].index}
            item={item[0]}
            locked={lockedMap[item[0].bucket.hash]}
            onExclude={toggleLockedItem}
          />
        ))}
      </div>
    </div>
  );
}
