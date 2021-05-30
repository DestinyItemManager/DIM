import Sheet from 'app/dim-ui/Sheet';
import { t } from 'app/i18next-t';
import ConnectedInventoryItem from 'app/inventory/ConnectedInventoryItem';
import { DimItem, PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { allItemsSelector, currentStoreSelector } from 'app/inventory/selectors';
import { updateLoadout } from 'app/loadout-drawer/actions';
import { Loadout, LoadoutItem } from 'app/loadout-drawer/loadout-types';
import { getModRenderKey } from 'app/loadout/mod-utils';
import { useD2Definitions } from 'app/manifest/selectors';
import { RootState, ThunkDispatchProp } from 'app/store/types';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import produce from 'immer';
import _ from 'lodash';
import React, { useMemo, useState } from 'react';
import { connect } from 'react-redux';
import { getItemsFromLoadoutItems } from '../../loadout-drawer/loadout-utils';
import { assignModsToArmorSet } from '../mod-utils';
import { getTotalModStatChanges } from '../process/mappers';
import { ArmorSet, LockableBucketHashes, statHashes, statKeys, StatTypes } from '../types';
import { getPower } from '../utils';
import styles from './CompareDrawer.m.scss';
import Mod from './Mod';
import SetStats from './SetStats';
import Sockets from './Sockets';

function getItemStats(item: DimItem, assumeMasterwork: boolean | null) {
  const baseStats = _.mapValues(
    statHashes,
    (value) => item.stats?.find((s) => s.statHash === value)?.base || 0
  );

  if (assumeMasterwork || item.energy?.energyCapacity === 10) {
    for (const statType of statKeys) {
      baseStats[statType] += 2;
    }
  }

  return baseStats;
}

interface ProvidedProps {
  set: ArmorSet;
  loadouts: Loadout[];
  lockedMods: PluggableInventoryItemDefinition[];
  classType: DestinyClass;
  statOrder: StatTypes[];
  enabledStats: Set<StatTypes>;
  assumeMasterwork: boolean;
  onClose(): void;
}

interface StoreProps {
  characterClass?: DestinyClass;
  allItems: DimItem[];
}

type Props = ProvidedProps & StoreProps & ThunkDispatchProp;

function mapStateToProps() {
  return (state: RootState): StoreProps => ({
    allItems: allItemsSelector(state),
    characterClass: currentStoreSelector(state)?.classType,
  });
}

function CompareDrawer({
  characterClass,
  loadouts,
  set,
  lockedMods,
  allItems,
  classType,
  statOrder,
  enabledStats,
  assumeMasterwork,
  onClose,
  dispatch,
}: Props) {
  const defs = useD2Definitions()!;
  const useableLoadouts = loadouts.filter((l) => l.classType === classType);

  const [selectedLoadout, setSelectedLoadout] = useState<Loadout | undefined>(
    useableLoadouts.length ? useableLoadouts[0] : undefined
  );

  const setItems = set.armor.map((items) => items[0]);

  // This probably isn't needed but I am being cautious as it iterates over the stores.
  const loadoutItems = useMemo(() => {
    const equippedItems = selectedLoadout?.items.filter((item) => item.equipped);
    const [items] = getItemsFromLoadoutItems(equippedItems, defs, allItems);
    return _.sortBy(
      items.filter((item) => LockableBucketHashes.includes(item.bucket.hash)),
      (item) => LockableBucketHashes.indexOf(item.bucket.hash)
    );
  }, [selectedLoadout, defs, allItems]);
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

  const lockedModStats = getTotalModStatChanges(lockedMods);

  for (const statType of statKeys) {
    loadoutStats[statType] += lockedModStats[statType];
  }

  const [assignedMods] = assignModsToArmorSet(
    set.armor.map((items) => items[0]),
    lockedMods
  );

  const [loadoutAssignedMods, loadoutUnassignedMods] = assignModsToArmorSet(
    loadoutItems,
    lockedMods
  );

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

  const modCounts = {};

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
            items={setItems}
            stats={set.stats}
            maxPower={getPower(setItems)}
            statOrder={statOrder}
            enabledStats={enabledStats}
            className={styles.fillRow}
          />
          <div className={clsx(styles.fillRow, styles.set)}>
            {setItems.map((item) => (
              <div key={item.bucket.hash} className={styles.item}>
                <ConnectedInventoryItem item={item} />
                <Sockets item={item} lockedMods={assignedMods[item.id]} />
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
                items={loadoutItems}
                stats={loadoutStats}
                maxPower={loadoutMaxPower}
                statOrder={statOrder}
                enabledStats={enabledStats}
                className={styles.fillRow}
                characterClass={characterClass}
              />
              <div className={clsx(styles.fillRow, styles.set)}>
                {loadoutItems.map((item) => (
                  <div
                    key={item.bucket.hash}
                    className={styles.item}
                    style={{ gridColumn: LockableBucketHashes.indexOf(item.bucket.hash) + 1 }}
                  >
                    <ConnectedInventoryItem item={item} />
                    <Sockets item={item} lockedMods={loadoutAssignedMods[item.id]} />
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
                  <Mod
                    key={getModRenderKey(unassigned, modCounts)}
                    plugDef={unassigned}
                    large={true}
                  />
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

export default connect(mapStateToProps)(CompareDrawer);
