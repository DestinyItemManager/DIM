import { LoadoutParameters, UpgradeSpendTier } from '@destinyitemmanager/dim-api-types';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import Sheet from 'app/dim-ui/Sheet';
import { t } from 'app/i18next-t';
import ConnectedInventoryItem from 'app/inventory/ConnectedInventoryItem';
import { DimItem, PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { allItemsSelector, bucketsSelector } from 'app/inventory/selectors';
import { isPluggableItem } from 'app/inventory/store/sockets';
import { updateLoadout } from 'app/loadout-drawer/actions';
import { getItemsFromLoadoutItems } from 'app/loadout-drawer/loadout-item-conversion';
import { DimLoadoutItem, Loadout, LoadoutItem } from 'app/loadout-drawer/loadout-types';
import { upgradeSpendTierToMaxEnergy } from 'app/loadout/armor-upgrade-utils';
import Mod from 'app/loadout/loadout-ui/Mod';
import Sockets from 'app/loadout/loadout-ui/Sockets';
import { getCheapestModAssignments } from 'app/loadout/mod-assignment-utils';
import { createGetModRenderKey } from 'app/loadout/mod-utils';
import { useD2Definitions } from 'app/manifest/selectors';
import { armorStats } from 'app/search/d2-known-values';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import { emptyArray } from 'app/utils/empty';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import produce from 'immer';
import _ from 'lodash';
import React, { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { getTotalModStatChanges } from '../process/mappers';
import { ArmorSet, ArmorStats, LockableBucketHashes } from '../types';
import { getPower } from '../utils';
import styles from './CompareDrawer.m.scss';
import SetStats from './SetStats';

function getItemStats(
  defs: D2ManifestDefinitions,
  item: DimItem,
  upgradeSpendTier: UpgradeSpendTier
): ArmorStats {
  const baseStats = armorStats.reduce((memo, statHash) => {
    memo[statHash] = item.stats?.find((s) => s.statHash === statHash)?.base || 0;
    return memo;
    // eslint-disable-next-line @typescript-eslint/prefer-reduce-type-parameter
  }, {} as ArmorStats);

  if (
    upgradeSpendTierToMaxEnergy(defs, upgradeSpendTier, item) === 10 ||
    item.energy?.energyCapacity === 10
  ) {
    for (const statHash of armorStats) {
      baseStats[statHash] += 2;
    }
  }

  return baseStats;
}

interface Props {
  set: ArmorSet;
  loadouts: Loadout[];
  initialLoadoutId?: string;
  lockedMods: PluggableInventoryItemDefinition[];
  subclass: DimLoadoutItem | undefined;
  classType: DestinyClass;
  statOrder: number[];
  enabledStats: Set<number>;
  upgradeSpendTier: UpgradeSpendTier;
  lockItemEnergyType: boolean;
  params: LoadoutParameters;
  notes?: string;
  onClose(): void;
}

function chooseInitialLoadout(
  setItems: DimItem[],
  useableLoadouts: Loadout[],
  initialLoadoutId?: string
): Loadout | undefined {
  const loadoutFromInitialId = useableLoadouts.find((lo) => lo.id === initialLoadoutId);
  if (loadoutFromInitialId) {
    return loadoutFromInitialId;
  }
  const exotic = setItems.find((i) => i.isExotic);
  return (
    (exotic && useableLoadouts.find((l) => l.items.some((i) => i.hash === exotic.hash))) ||
    (useableLoadouts.length ? useableLoadouts[0] : undefined)
  );
}

export default function CompareDrawer({
  loadouts,
  initialLoadoutId,
  set,
  lockedMods,
  subclass,
  classType,
  statOrder,
  enabledStats,
  upgradeSpendTier,
  lockItemEnergyType,
  params,
  notes,
  onClose,
}: Props) {
  const dispatch = useThunkDispatch();
  const defs = useD2Definitions()!;
  const buckets = useSelector(bucketsSelector)!;
  const useableLoadouts = loadouts.filter((l) => l.classType === classType);
  const getModRenderKey = createGetModRenderKey();

  const setItems = set.armor.map((items) => items[0]);

  const [selectedLoadout, setSelectedLoadout] = useState<Loadout | undefined>(() =>
    chooseInitialLoadout(setItems, useableLoadouts, initialLoadoutId)
  );

  const allItems = useSelector(allItemsSelector);

  // This probably isn't needed but I am being cautious as it iterates over the stores.
  const loadoutItems = useMemo(() => {
    const equippedItems = selectedLoadout?.items.filter((item) => item.equipped);
    const [items] = getItemsFromLoadoutItems(equippedItems, defs, buckets, allItems);
    return _.sortBy(
      items.filter((item) => LockableBucketHashes.includes(item.bucket.hash)),
      (item) => LockableBucketHashes.indexOf(item.bucket.hash)
    );
  }, [selectedLoadout, defs, buckets, allItems]);

  const { loSetAssignedMods, itemModAssignments, unassignedMods } = useMemo(() => {
    const { itemModAssignments: loSetAssignedMods } = getCheapestModAssignments(
      setItems,
      lockedMods,
      defs,
      upgradeSpendTier,
      lockItemEnergyType
    );
    const { itemModAssignments, unassignedMods } = getCheapestModAssignments(
      loadoutItems,
      lockedMods,
      defs,
      upgradeSpendTier,
      lockItemEnergyType
    );

    return {
      loSetAssignedMods: loSetAssignedMods,
      itemModAssignments: itemModAssignments,
      unassignedMods,
    };
  }, [defs, loadoutItems, lockItemEnergyType, lockedMods, setItems, upgradeSpendTier]);

  if (!set) {
    return null;
  }

  const loadoutMaxPower = _.sumBy(loadoutItems, (i) => i.power) / loadoutItems.length;
  const loadoutStats = armorStats.reduce((memo, statHash) => {
    memo[statHash] = 0;
    return memo;
    // eslint-disable-next-line @typescript-eslint/prefer-reduce-type-parameter
  }, {} as ArmorStats);

  for (const item of loadoutItems) {
    const itemStats = getItemStats(defs, item, upgradeSpendTier);
    for (const statHash of armorStats) {
      loadoutStats[statHash] += itemStats[statHash];
    }
  }

  const subclassPlugs = subclass?.socketOverrides
    ? Object.values(subclass.socketOverrides)
        .map((hash) => defs.InventoryItem.get(hash))
        .filter(isPluggableItem)
    : emptyArray<PluggableInventoryItemDefinition>();

  const lockedModStats = getTotalModStatChanges(lockedMods, subclassPlugs, classType);

  for (const statHash of armorStats) {
    loadoutStats[statHash] += lockedModStats[statHash];
  }

  const onSaveLoadout = (e: React.MouseEvent) => {
    e.preventDefault();

    if (
      selectedLoadout &&
      !confirm(t('LoadoutBuilder.ConfirmOverwrite', { name: selectedLoadout.name }))
    ) {
      return;
    }

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
        draftLoadout.parameters = params;
        draftLoadout.notes = notes || draftLoadout.notes;
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
        <div>
          <div className={clsx(styles.fillRow, styles.setHeader)}>
            <div className={styles.setTitle}>{t('LoadoutBuilder.OptimizerSet')}</div>
            <button className="dim-button" type="button" onClick={onSaveLoadout}>
              {t('LoadoutBuilder.SaveAs')}{' '}
              <span className={styles.loadoutName}>{selectedLoadout.name}</span>
            </button>
          </div>
          <SetStats
            stats={set.stats}
            maxPower={getPower(setItems)}
            statOrder={statOrder}
            enabledStats={enabledStats}
            className={styles.fillRow}
            characterClass={classType}
          />
          <div className={clsx(styles.fillRow, styles.set)}>
            {setItems.map((item) => (
              <div key={item.bucket.hash} className={styles.item}>
                <ConnectedInventoryItem item={item} />
                <Sockets item={item} lockedMods={loSetAssignedMods[item.id]} size="small" />
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className={clsx(styles.fillRow, styles.setHeader)}>
            <div className={styles.setTitle}>{t('LoadoutBuilder.ExistingLoadout')}</div>
            <select
              value={selectedLoadout.id}
              onChange={(event) => {
                const selected = useableLoadouts.find((l) => l.id === event.target.value);
                setSelectedLoadout(selected);
              }}
            >
              {useableLoadouts.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>
          {loadoutItems.length ? (
            <>
              <SetStats
                stats={loadoutStats}
                maxPower={loadoutMaxPower}
                statOrder={statOrder}
                enabledStats={enabledStats}
                className={styles.fillRow}
                characterClass={classType}
              />
              <div className={clsx(styles.fillRow, styles.set)}>
                {loadoutItems.map((item) => (
                  <div
                    key={item.bucket.hash}
                    className={styles.item}
                    style={{ gridColumn: LockableBucketHashes.indexOf(item.bucket.hash) + 1 }}
                  >
                    <ConnectedInventoryItem item={item} />
                    <Sockets item={item} lockedMods={itemModAssignments[item.id]} size="small" />
                  </div>
                ))}
              </div>
              {Boolean(unassignedMods.length) && (
                <div className={styles.unassigned}>
                  {t('LoadoutBuilder.TheseModsCouldNotBeAssigned')}
                </div>
              )}
              <div className={styles.unassignedMods}>
                {unassignedMods.map((unassigned) => (
                  <Mod key={getModRenderKey(unassigned)} plugDef={unassigned} large={true} />
                ))}
              </div>
            </>
          ) : (
            <div className={styles.noLoadouts}>{t('LoadoutBuilder.NoComparableItems')}</div>
          )}
        </div>
      </div>
    </Sheet>
  );
}
