import React, { useMemo, useState } from 'react';
import Sheet from 'app/dim-ui/Sheet';
import { ArmorSet, LockedArmor2ModMap, LockableBucketHashes, StatTypes } from '../types';
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
import { DestinyClass } from 'bungie-api-ts/destiny2';
import SetStats from '../generated-sets/SetStats';

interface ProvidedProps {
  set: ArmorSet;
  lockedModMap: LockedArmor2ModMap;
  defs: D2ManifestDefinitions;
  classType: DestinyClass;
  statOrder: StatTypes[];
  enabledStats: Set<StatTypes>;
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
  lockedModMap,
  defs,
  classType,
  statOrder,
  enabledStats,
  onClose,
}: Props) {
  const useableLoadouts = loadouts.filter((l) => l.classType === classType);

  const [selectedLoadout, setSelectedLoadout] = useState<Loadout | undefined>(
    useableLoadouts.length ? useableLoadouts[0] : undefined
  );
  const items = useMemo(() => {
    const [items] = getItemsFromLoadoutItems(selectedLoadout?.items, defs, stores);
    return items.filter((item) => LockableBucketHashes.includes(item.bucket.hash));
  }, [selectedLoadout, defs, stores]);
  if (!set) {
    return null;
  }

  const assignedMods = assignModsToArmorSet(
    set.armor.map((items) => items[0]),
    lockedModMap
  );

  console.log(selectedLoadout?.name);

  const header = <div className={styles.header}>Compare Loadout</div>;
  return (
    <Sheet onClose={onClose} header={header}>
      <div className={styles.content}>
        <div className={styles.setHeader}>Optimiser Set</div>
        <SetStats
          defs={defs}
          stats={set.stats}
          items={set.armor.map((items) => items[0])}
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
        <div className={styles.set}>
          {items.map((item) => (
            <div key={item.bucket.hash} className={styles.item}>
              <ConnectedInventoryItem item={item} />
              <Sockets item={item} defs={defs} />
            </div>
          ))}
        </div>
      </div>
    </Sheet>
  );
}

export default connect(mapStateToProps)(CompareDrawer);
