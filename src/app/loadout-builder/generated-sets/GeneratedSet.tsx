import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { t } from 'app/i18next-t';
import { DimItem, PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { DimStore, statSourceOrder } from 'app/inventory/store-types';
import { Loadout } from 'app/loadout/loadout-types';
import { fitMostMods } from 'app/loadout/mod-assignment-utils';
import { getTotalModStatChanges } from 'app/loadout/stats';
import { useD2Definitions } from 'app/manifest/selectors';
import { armorStats } from 'app/search/d2-known-values';
import { compareBy } from 'app/utils/comparators';
import { errorLog } from 'app/utils/log';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import { StatHashes } from 'data/d2/generated-enums';
import _ from 'lodash';
import { Dispatch, memo, useMemo } from 'react';
import { LoadoutBuilderAction } from '../loadout-builder-reducer';
import {
  ArmorEnergyRules,
  ArmorSet,
  ArmorStatHashes,
  DesiredStatRange,
  ModStatChanges,
  PinnedItems,
} from '../types';
import { getPower } from '../utils';
import styles from './GeneratedSet.m.scss';
import GeneratedSetButtons from './GeneratedSetButtons';
import GeneratedSetItem from './GeneratedSetItem';
import { SetStats } from './SetStats';

/**
 * A single "stat mix" of builds. Each armor slot contains multiple possibilities,
 * but only the highest light set is displayed.
 */
export default memo(function GeneratedSet({
  originalLoadout,
  set,
  selectedStore,
  lockedMods,
  pinnedItems,
  desiredStatRanges,
  modStatChanges,
  loadouts,
  lbDispatch,
  halfTierMods,
  armorEnergyRules,
  equippedHashes,
  autoStatMods,
  isEditingExistingLoadout,
}: {
  originalLoadout: Loadout;
  set: ArmorSet;
  selectedStore: DimStore;
  lockedMods: PluggableInventoryItemDefinition[];
  pinnedItems: PinnedItems;
  desiredStatRanges: DesiredStatRange[];
  modStatChanges: ModStatChanges;
  loadouts: Loadout[];
  lbDispatch: Dispatch<LoadoutBuilderAction>;
  halfTierMods: PluggableInventoryItemDefinition[];
  armorEnergyRules: ArmorEnergyRules;
  equippedHashes: Set<number>;
  autoStatMods: boolean;
  isEditingExistingLoadout: boolean;
}) {
  const defs = useD2Definitions()!;

  let overlappingLoadout: Loadout | undefined;
  // Items are sorted by their energy capacity when grouping
  let displayedItems: DimItem[] = set.armor.map((items) => items[0]);
  const allSetItems = set.armor.flat();

  // This has got to be expensive when the user has a lot of loadouts?
  for (const loadout of loadouts) {
    // Compare all possible items that could make up this set (not just the first item in each bucket) against all the equipped items of the given loadout
    const equippedLoadoutItems = loadout.items.filter((item) => item.equip);
    const intersection = _.intersectionBy(allSetItems, equippedLoadoutItems, (item) => item.id);
    if (intersection.length === set.armor.length) {
      overlappingLoadout = loadout;
      // Replace the list of items to show with the ones that were from the matching loadout
      displayedItems = intersection;
      break;
    }
  }

  // Automatically added stat/artifice mods
  const autoMods = useMemo(
    () => set.statMods.map((d) => defs.InventoryItem.get(d) as PluggableInventoryItemDefinition),
    [defs.InventoryItem, set.statMods],
  );

  // Assign the chosen mods to items so we can display them as if they were slotted
  const [itemModAssignments, resultingItemEnergies] = useMemo(() => {
    const allMods = [...lockedMods, ...autoMods];
    const { itemModAssignments, unassignedMods, invalidMods, resultingItemEnergies } = fitMostMods({
      defs,
      items: displayedItems,
      plannedMods: allMods,
      armorEnergyRules,
    });

    // Set rendering is a great place to verify that the worker process
    // and DIM's regular mod assignment algorithm agree with each other,
    // so do that here.
    if (unassignedMods.length || invalidMods.length) {
      errorLog(
        'loadout optimizer',
        'internal error: set rendering was unable to fit some mods that the worker thought were possible',
        unassignedMods,
        invalidMods,
      );
    }

    return [itemModAssignments, resultingItemEnergies];
  }, [lockedMods, autoMods, defs, displayedItems, armorEnergyRules]);

  // Compute a presentable stat breakdown, lazily. This is a bit expensive, so we calculate it only
  // when it's actually needed (in the tooltip), and memoize this via _.once (no need to memoize
  // the memoized function since this component itself is memoized and the dependency array would
  // include most props).
  const getStatsBreakdownOnce = _.once(() =>
    getStatsBreakdown(defs, selectedStore.classType, set, autoMods, modStatChanges),
  );

  const boostedStats = useMemo(
    () =>
      new Set(
        armorStats.filter((hash) =>
          modStatChanges[hash].breakdown?.some((change) => change.source === 'runtimeEffect'),
        ),
      ),
    [modStatChanges],
  );

  // Distribute our automatically picked mods across the items so that item components
  // can highlight them
  const assignAutoMods = set.statMods.slice();
  const autoModsPerItem = _.mapValues(itemModAssignments, (mods) => {
    const autoModHashes = [];
    for (const mod of mods) {
      const modIdx = assignAutoMods.findIndex((m) => m === mod.hash);
      if (modIdx !== -1) {
        autoModHashes.push(mod.hash);
        assignAutoMods.splice(modIdx, 1);
      }
    }
    return autoModHashes;
  });

  const canCompareLoadouts = loadouts.length > 0;

  return (
    <>
      <SetStats
        stats={set.stats}
        getStatsBreakdown={getStatsBreakdownOnce}
        maxPower={getPower(displayedItems)}
        desiredStatRanges={desiredStatRanges}
        boostedStats={boostedStats}
        existingLoadoutName={overlappingLoadout?.name}
        equippedHashes={equippedHashes}
        autoStatMods={autoStatMods}
      />
      <div className={styles.build}>
        <div className={styles.items}>
          {displayedItems.map((item, i) => (
            <GeneratedSetItem
              key={item.index}
              item={item}
              itemOptions={set.armor[i]}
              pinned={pinnedItems[item.bucket.hash] === item}
              lbDispatch={lbDispatch}
              assignedMods={itemModAssignments[item.id]}
              autoStatMods={autoStatMods}
              automaticallyPickedMods={autoModsPerItem[item.id]}
              energy={resultingItemEnergies[item.id]}
            />
          ))}
        </div>
        <GeneratedSetButtons
          originalLoadout={originalLoadout}
          set={set}
          items={displayedItems}
          lockedMods={lockedMods}
          store={selectedStore}
          isEditingExistingLoadout={isEditingExistingLoadout}
          canCompareLoadouts={canCompareLoadouts}
          halfTierMods={halfTierMods}
          lbDispatch={lbDispatch}
        />
      </div>
    </>
  );
});

export const containerClass = styles.container;

/**
 * Compute a presentable stat breakdown. This info isn't quite easy to get since
 * the process worker responds with full build stats and auto mod hashes and
 * simply says "trust me, these are correct". When the user wants to actually
 * see the breakdown, we have to add the summed up ProcessItem armor stats
 * (which the worker does respond with), the mod/subclass stats from the loadout
 * (with LoadoutBuilder calculates higher up and passes to the worker too), and
 * the auto mods the worker picked (which we calculate via
 * `getTotalModStatChanges` here).
 */
function getStatsBreakdown(
  defs: D2ManifestDefinitions,
  classType: DestinyClass,
  set: ArmorSet,
  autoMods: PluggableInventoryItemDefinition[],
  modStatChanges: ModStatChanges,
) {
  const totals: ModStatChanges = {
    [StatHashes.Mobility]: { value: 0, breakdown: [] },
    [StatHashes.Resilience]: { value: 0, breakdown: [] },
    [StatHashes.Recovery]: { value: 0, breakdown: [] },
    [StatHashes.Discipline]: { value: 0, breakdown: [] },
    [StatHashes.Intellect]: { value: 0, breakdown: [] },
    [StatHashes.Strength]: { value: 0, breakdown: [] },
  };

  const autoModStats = getTotalModStatChanges(
    defs,
    autoMods,
    /* subclass */ undefined,
    classType,
    /* includeRuntimeStatBenefits */ false, // doesn't matter, auto mods have no runtime stats
  );

  // We have a bit of a problem where armor mods can come from both
  // the global loadout parameters (modStatChanges) and the auto stat mods
  // (autoModStats), so we have to merge them together here by matching
  // hashes and adding counts/values
  const mergeContributions = (
    contributions: ModStatChanges[ArmorStatHashes],
    hash: ArmorStatHashes,
  ) => {
    totals[hash].value += contributions.value;
    if (contributions.breakdown) {
      const existingBreakdown = totals[hash].breakdown!;
      for (const part of contributions.breakdown) {
        const existingIndex = existingBreakdown.findIndex(
          (change) => change.source === part.source && change.hash === part.hash,
        );
        if (existingIndex === -1) {
          existingBreakdown.push(part);
        } else {
          const existingEntry = existingBreakdown[existingIndex];
          existingBreakdown[existingIndex] = {
            ...existingEntry,
            count:
              existingEntry.count || part.count
                ? (existingEntry.count ?? 0) + (part.count ?? 0)
                : undefined,
            value: existingEntry.value + part.value,
          };
        }
      }
    }
  };

  for (const hash of armorStats) {
    totals[hash].value += set.armorStats[hash];
    totals[hash].breakdown!.push({
      hash: -1,
      count: undefined,
      name: t('Loadouts.ArmorStats'),
      icon: undefined,
      source: 'armorStats',
      value: set.armorStats[hash],
    });

    mergeContributions(modStatChanges[hash], hash);
    mergeContributions(autoModStats[hash], hash);

    // Similarly to the above, a good place to check for errors -- if the worker thinks a set has
    // certain stats, and we calculate different stats, then that's a bug somewhere.
    if (totals[hash].value !== set.stats[hash]) {
      errorLog(
        'loadout optimizer',
        'internal error: set rendering came up with different build stats from what the worker said',
        totals,
        set.stats,
      );
    }
  }
  for (const val of Object.values(totals)) {
    val.breakdown!.sort(compareBy((val) => statSourceOrder.indexOf(val.source)));
  }
  return totals;
}
