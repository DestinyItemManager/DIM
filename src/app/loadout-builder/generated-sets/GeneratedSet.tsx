import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { t } from 'app/i18next-t';
import { Loadout } from 'app/loadout/loadout-types';
import { editLoadout } from 'app/loadout/LoadoutDrawer';
import React, { Dispatch } from 'react';
import { DimStore } from '../../inventory/store-types';
import { LoadoutBuilderAction } from '../loadoutBuilderReducer';
import { assignModsToArmorSet } from '../mod-utils';
import { ArmorSet, LockedArmor2ModMap, LockedMap, StatTypes } from '../types';
import styles from './GeneratedSet.m.scss';
import GeneratedSetButtons from './GeneratedSetButtons';
import GeneratedSetItem from './GeneratedSetItem';
import SetStats from './SetStats';

interface Props {
  set: ArmorSet;
  selectedStore?: DimStore;
  lockedMap: LockedMap;
  style: React.CSSProperties;
  statOrder: StatTypes[];
  defs: D2ManifestDefinitions;
  forwardedRef?: React.Ref<HTMLDivElement>;
  enabledStats: Set<StatTypes>;
  lockedArmor2Mods: LockedArmor2ModMap;
  loadouts: Loadout[];
  lbDispatch: Dispatch<LoadoutBuilderAction>;
}

/**
 * A single "stat mix" of builds. Each armor slot contains multiple possibilities,
 * but only the highest light set is displayed.
 */
function GeneratedSet({
  set,
  selectedStore,
  lockedMap,
  style,
  statOrder,
  defs,
  enabledStats,
  forwardedRef,
  lockedArmor2Mods,
  loadouts,
  lbDispatch,
}: Props) {
  // Set the loadout property to show/hide the loadout menu
  const setCreateLoadout = (loadout: Loadout) => {
    editLoadout(loadout, { showClass: false });
  };

  if (set.armor.some((items) => !items.length)) {
    console.error('No valid sets!');
    return null;
  }

  const [assignedMods] = assignModsToArmorSet(
    set.armor.map((items) => items[0]),
    lockedArmor2Mods
  );

  const canCompareLoadouts =
    set.armor.every((items) => items[0].classType === selectedStore?.classType) &&
    loadouts.some((l) => l.classType === selectedStore?.classType);

  const existingLoadout = loadouts.find((loadout) =>
    set.armor.every((items) => loadout.items.map((item) => item.id).includes(items[0].id))
  );

  return (
    <div className={styles.build} style={style} ref={forwardedRef}>
      <div className={styles.header}>
        <div>
          <SetStats
            defs={defs}
            stats={set.stats}
            items={set.armor.map((items) => items[0])}
            maxPower={set.maxPower}
            statOrder={statOrder}
            enabledStats={enabledStats}
          />
          {existingLoadout ? (
            <span className={styles.existingLoadout}>
              {t('LoadoutBuilder.ExistingLoadout')}:{' '}
              <span className={styles.loadoutName}>{existingLoadout.name}</span>
            </span>
          ) : null}
        </div>
        <GeneratedSetButtons
          set={set}
          store={selectedStore!}
          canCompareLoadouts={canCompareLoadouts}
          onLoadoutSet={setCreateLoadout}
          onCompareSet={() => lbDispatch({ type: 'openCompareDrawer', set })}
        />
      </div>
      <div className={styles.items}>
        {set.armor.map((items, index) => (
          <GeneratedSetItem
            key={items[0].index}
            item={items[0]}
            defs={defs}
            itemOptions={items}
            locked={lockedMap[items[0].bucket.hash]}
            lbDispatch={lbDispatch}
            statValues={set.statChoices[index]}
            lockedMods={assignedMods[items[0].id]}
            statOrder={statOrder}
          />
        ))}
      </div>
    </div>
  );
}

export default React.memo(
  React.forwardRef<HTMLDivElement, Props>((props, ref) => (
    <GeneratedSet forwardedRef={ref} {...props} />
  ))
);
