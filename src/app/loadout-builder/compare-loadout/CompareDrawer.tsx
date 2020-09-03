import React, { useMemo, useState } from 'react';
import _ from 'lodash';
import Sheet from 'app/dim-ui/Sheet';
import {
  ArmorSet,
  LockedArmor2ModMap,
  LockableBucketHashes,
  StatTypes,
  LockedMap,
  statKeys,
  statHashes,
} from '../types';
import ConnectedInventoryItem from 'app/inventory/ConnectedInventoryItem';
import styles from './CompareDrawer.m.scss';
import Sockets from '../Sockets';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { assignModsToArmorSet } from '../mod-utils';
import { Loadout } from 'app/loadout/loadout-types';
import { loadoutsSelector } from 'app/loadout/reducer';
import { RootState } from 'app/store/types';
import { connect } from 'react-redux';
import { DimStore } from 'app/inventory/store-types';
import { storesSelector } from 'app/inventory/selectors';
import { getItemsFromLoadoutItems } from '../../loadout/loadout-utils';
import { DestinyClass, DestinySocketCategoryStyle } from 'bungie-api-ts/destiny2';
import SetStats from '../generated-sets/SetStats';
import { getTotalModStatChanges } from '../processWorker/mappers';
import { DimItem } from 'app/inventory/item-types';
import Mod from '../Mod';

function getItemStats(item: DimItem, assumeMasterwork: boolean | null) {
  const baseStats = _.mapValues(
    statHashes,
    (value) => item.stats?.find((s) => s.statHash === value)?.base || 0
  );

  // Checking energy tells us if it is Armour 2.0 (it can have value 0)
  if (item.isDestiny2() && item.sockets && item.energy) {
    let masterworkSocketHashes: number[] = [];
    // only get masterwork sockets if we aren't manually adding the values
    if (!assumeMasterwork) {
      const masterworkSocketCategory = item.sockets.categories.find(
        (sockCat) => sockCat.category.categoryStyle === DestinySocketCategoryStyle.EnergyMeter
      );

      if (masterworkSocketCategory) {
        masterworkSocketHashes = masterworkSocketCategory.sockets
          .map((socket) => socket?.plugged?.plugDef.hash ?? NaN)
          .filter((val) => !isNaN(val));
      }
    }

    if (masterworkSocketHashes.length) {
      for (const socket of item.sockets.allSockets) {
        const plugHash = socket?.plugged?.plugDef.hash ?? NaN;

        if (socket.plugged?.stats && masterworkSocketHashes.includes(plugHash)) {
          for (const statType of statKeys) {
            const statHash = statHashes[statType];
            if (socket.plugged.stats[statHash]) {
              baseStats[statType] += socket.plugged.stats[statHash];
            }
          }
        }
      }
    }

    if (assumeMasterwork) {
      for (const statType of statKeys) {
        baseStats[statType] += 2;
      }
    }
  }
  return baseStats;
}

interface ProvidedProps {
  set: ArmorSet;
  lockedMap: LockedMap;
  lockedArmor2Mods: LockedArmor2ModMap;
  defs: D2ManifestDefinitions;
  classType: DestinyClass;
  statOrder: StatTypes[];
  enabledStats: Set<StatTypes>;
  assumeMasterwork: boolean;
  onClose(): void;
}

interface StoreProps {
  stores: DimStore[];
  loadouts: Loadout[];
}

type Props = ProvidedProps & StoreProps;

function mapStateToProps() {
  return (state: RootState): StoreProps => ({
    stores: storesSelector(state),
    loadouts: loadoutsSelector(state),
  });
}

function CompareDrawer({
  stores,
  loadouts,
  set,
  lockedMap,
  lockedArmor2Mods,
  defs,
  classType,
  statOrder,
  enabledStats,
  assumeMasterwork,
  onClose,
}: Props) {
  const useableLoadouts = loadouts.filter((l) => l.classType === classType);

  const [selectedLoadout, setSelectedLoadout] = useState<Loadout | undefined>(
    useableLoadouts.length ? useableLoadouts[0] : undefined
  );

  // This probably isn't needed but I am being cautious as it iterates over the stores.
  const loadoutItems = useMemo(() => {
    const [items] = getItemsFromLoadoutItems(selectedLoadout?.items, defs, stores);
    return _.sortBy(
      items.filter((item) => LockableBucketHashes.includes(item.bucket.hash)),
      (item) => LockableBucketHashes.indexOf(item.bucket.hash)
    );
  }, [selectedLoadout, defs, stores]);
  if (!set) {
    return null;
  }

  const loadoutMaxPower = _.sumBy(loadoutItems, (i) => i.basePower) / loadoutItems.length;
  const loadoutStats = _.mapValues(statHashes, () => 0);

  for (const item of loadoutItems) {
    const itemStats = getItemStats(item, assumeMasterwork);
    for (const statType of statKeys) {
      loadoutStats[statType] += itemStats[statType];
    }
  }

  const lockedModStats = getTotalModStatChanges(lockedMap, lockedArmor2Mods);

  for (const statType of statKeys) {
    loadoutStats[statType] += lockedModStats[statType];
  }

  const [assignedMods] = assignModsToArmorSet(
    set.armor.map((items) => items[0]),
    lockedArmor2Mods
  );

  const [loadoutAssignedMods, loadoutUnassignedMods] = assignModsToArmorSet(
    loadoutItems,
    lockedArmor2Mods
  );

  const header = <div className={styles.header}>Compare Loadout</div>;
  return (
    <Sheet onClose={onClose} header={header}>
      <div className={styles.content}>
        <div className={styles.setHeader}>Optimiser Set</div>
        <SetStats
          defs={defs}
          items={set.armor.map((items) => items[0])}
          stats={set.stats}
          maxPower={set.maxPower}
          statOrder={statOrder}
          enabledStats={enabledStats}
        />
        <div className={styles.set}>
          {set.armor.map((items) => (
            <div key={items[0].bucket.hash} className={styles.item}>
              <ConnectedInventoryItem item={items[0]} />
              <Sockets item={items[0]} lockedMods={assignedMods[items[0].id]} defs={defs} />
            </div>
          ))}
        </div>
        <div className={styles.setHeader}>Loadout</div>
        <select
          className={styles.loadoutSelect}
          onChange={(event) => {
            const selected = useableLoadouts.find((l) => l.id === event.target.value);
            setSelectedLoadout(selected);
          }}
        >
          {useableLoadouts.map((l) => (
            <option key={l.id} value={l.id} selected={l.id === selectedLoadout?.id}>
              {l.name}
            </option>
          ))}
        </select>
        <SetStats
          defs={defs}
          items={loadoutItems}
          stats={loadoutStats}
          maxPower={loadoutMaxPower}
          statOrder={statOrder}
          enabledStats={enabledStats}
        />
        <div className={styles.set}>
          {loadoutItems.map((item) => (
            <div key={item.bucket.hash} className={styles.item}>
              <ConnectedInventoryItem item={item} />
              <Sockets item={item} lockedMods={loadoutAssignedMods[item.id]} defs={defs} />
            </div>
          ))}
        </div>
        <div className={styles.unassigned}>These mods could not be assigned to the loadout.</div>
        <div className={styles.unassignedMods}>
          {loadoutUnassignedMods.map((unassigned) => (
            <Mod key={unassigned.key} plugDef={unassigned.mod} defs={defs} large={true} />
          ))}
        </div>
      </div>
    </Sheet>
  );
}

export default connect(mapStateToProps)(CompareDrawer);
