import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import Sheet from 'app/dim-ui/Sheet';
import { t } from 'app/i18next-t';
import ConnectedInventoryItem from 'app/inventory/ConnectedInventoryItem';
import { DimItem } from 'app/inventory/item-types';
import { storesSelector } from 'app/inventory/selectors';
import { DimStore } from 'app/inventory/store-types';
import { updateLoadout } from 'app/loadout/actions';
import { Loadout, LoadoutItem } from 'app/loadout/loadout-types';
import { RootState, ThunkDispatchProp } from 'app/store/types';
import { DestinyClass, DestinySocketCategoryStyle } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import produce from 'immer';
import _ from 'lodash';
import React, { useMemo, useState } from 'react';
import { connect } from 'react-redux';
import { getItemsFromLoadoutItems } from '../../loadout/loadout-utils';
import SetStats from '../generated-sets/SetStats';
import { assignModsToArmorSet } from '../mod-utils';
import { getTotalModStatChanges } from '../processWorker/mappers';
import {
  ArmorSet,
  LockableBucketHashes,
  LockedArmor2ModMap,
  statHashes,
  statKeys,
  StatTypes,
} from '../types';
import styles from './CompareDrawer.m.scss';
import Mod from './Mod';
import Sockets from './Sockets';

function getItemStats(item: DimItem, assumeMasterwork: boolean | null) {
  const baseStats = _.mapValues(
    statHashes,
    (value) => item.stats?.find((s) => s.statHash === value)?.base || 0
  );

  // Checking energy tells us if it is Armour 2.0 (it can have value 0)
  if (item.sockets && item.energy) {
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
  loadouts: Loadout[];
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
}

type Props = ProvidedProps & StoreProps & ThunkDispatchProp;

function mapStateToProps() {
  return (state: RootState): StoreProps => ({
    stores: storesSelector(state),
  });
}

function CompareDrawer({
  stores,
  loadouts,
  set,
  lockedArmor2Mods,
  defs,
  classType,
  statOrder,
  enabledStats,
  assumeMasterwork,
  onClose,
  dispatch,
}: Props) {
  const useableLoadouts = loadouts.filter((l) => l.classType === classType);

  const [selectedLoadout, setSelectedLoadout] = useState<Loadout | undefined>(
    useableLoadouts.length ? useableLoadouts[0] : undefined
  );

  const setItems = set.armor.map((items) => items[0]);

  // This probably isn't needed but I am being cautious as it iterates over the stores.
  const loadoutItems = useMemo(() => {
    const equippedItems = selectedLoadout?.items.filter((item) => item.equipped);
    const [items] = getItemsFromLoadoutItems(equippedItems, defs, stores);
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

  const lockedModStats = getTotalModStatChanges(lockedArmor2Mods);

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

  const onSaveLoadout = (e: React.MouseEvent) => {
    e.preventDefault();

    const loadoutToSave = produce(selectedLoadout, (draftLoadout) => {
      if (draftLoadout) {
        const newItems: LoadoutItem[] = setItems.map(({ id, hash }) => ({
          id,
          hash,
          amount: 1,
          equipped: true,
        }));
        for (const item of draftLoadout.items) {
          const dimItem = loadoutItems.find((i) => i.id === item.id);
          const hasBeenReplaced =
            dimItem && setItems.some((i) => i.bucket.hash === dimItem.bucket.hash);
          if (!hasBeenReplaced) {
            newItems.push(item);
          }
        }
        draftLoadout.items = newItems;
      }
    });

    if (!loadoutToSave) {
      return;
    }

    dispatch(updateLoadout(loadoutToSave));
    onClose();
  };

  const header = <div className={styles.header}>{t('LoadoutBuilder.CompareLoadout')}</div>;

  // This is likely never to happen but since it is disconnected to the button its here for safety.
  if (!selectedLoadout) {
    return (
      <Sheet onClose={onClose} header={header}>
        <div className={styles.noLoadouts}>{t('LoadoutBuilder.NoLoadoutsToCompare')}</div>
      </Sheet>
    );
  }

  return (
    <Sheet onClose={onClose} header={header}>
      <div className={styles.content}>
        <div className={clsx(styles.fillRow, styles.setHeader)}>
          <div className={styles.setTitle}>{t('LoadoutBuilder.OptimizerSet')}</div>
          <button className="dim-button" type="button" onClick={onSaveLoadout}>
            {t('LoadoutBuilder.SaveAs')}{' '}
            <span className={styles.loadoutName}>{selectedLoadout.name}</span>
          </button>
        </div>
        <SetStats
          defs={defs}
          items={setItems}
          stats={set.stats}
          maxPower={set.maxPower}
          statOrder={statOrder}
          enabledStats={enabledStats}
          className={styles.fillRow}
        />
        <div className={clsx(styles.fillRow, styles.set)}>
          {setItems.map((item) => (
            <div key={item.bucket.hash} className={styles.item}>
              <ConnectedInventoryItem item={item} />
              <Sockets item={item} lockedMods={assignedMods[item.id]} defs={defs} />
            </div>
          ))}
        </div>
        <div className={clsx(styles.fillRow, styles.setHeader)}>
          <div className={styles.setTitle}>{t('LoadoutBuilder.ExistingLoadout')}</div>
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
        </div>
        {loadoutItems.length ? (
          <>
            <SetStats
              defs={defs}
              items={loadoutItems}
              stats={loadoutStats}
              maxPower={loadoutMaxPower}
              statOrder={statOrder}
              enabledStats={enabledStats}
              className={styles.fillRow}
            />
            <div className={styles.set}>
              {loadoutItems.map((item) => (
                <div
                  key={item.bucket.hash}
                  className={styles.item}
                  style={{ gridColumn: LockableBucketHashes.indexOf(item.bucket.hash) + 1 }}
                >
                  <ConnectedInventoryItem item={item} />
                  <Sockets item={item} lockedMods={loadoutAssignedMods[item.id]} defs={defs} />
                </div>
              ))}
            </div>
            {Boolean(loadoutUnassignedMods.length) && (
              <div className={styles.unassigned}>
                {t('LoadoutBuilder.TheseModsCouldNotBeAssigned')}
              </div>
            )}
            <div className={styles.unassignedMods}>
              {loadoutUnassignedMods.map((unassigned) => (
                <Mod key={unassigned.key} plugDef={unassigned.mod} defs={defs} large={true} />
              ))}
            </div>
          </>
        ) : (
          <div className={styles.noLoadouts}>{t('LoadoutBuilder.NoComparableItems')}</div>
        )}
      </div>
    </Sheet>
  );
}

export default connect(mapStateToProps)(CompareDrawer);
