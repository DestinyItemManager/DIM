import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { isPluggableItem } from 'app/inventory/store/sockets';
import { calculateAssumedMasterworkStats } from 'app/loadout-drawer/loadout-utils';
import { calculateAssumedItemEnergy, isAssumedArtifice } from 'app/loadout/armor-upgrade-utils';
import {
  activityModPlugCategoryHashes,
  knownModPlugCategoryHashes,
} from 'app/loadout/known-values';
import { armorStats } from 'app/search/d2-known-values';
import { filterMap, mapValues, sumBy } from 'app/utils/collections';
import { compareBy } from 'app/utils/comparators';
import { DimItem, PluggableInventoryItemDefinition } from '../../inventory/item-types';
import {
  getModTypeTagByPlugCategoryHash,
  getSpecialtySocketMetadatas,
} from '../../utils/item-utils';
import { AutoModData, ProcessArmorSet, ProcessItem, ProcessMod } from '../process-worker/types';
import {
  ArmorEnergyRules,
  ArmorSet,
  AutoModDefs,
  ItemGroup,
  artificeSocketReusablePlugSetHash,
  artificeStatBoost,
  generalSocketReusablePlugSetHash,
  majorStatBoost,
  minorStatBoost,
} from '../types';

export function mapArmor2ModToProcessMod(mod: PluggableInventoryItemDefinition): ProcessMod {
  const processMod: ProcessMod = {
    hash: mod.hash,
    energyCost: mod.plug.energyCost?.energyCost ?? 0,
  };

  if (
    activityModPlugCategoryHashes.includes(mod.plug.plugCategoryHash) ||
    !knownModPlugCategoryHashes.includes(mod.plug.plugCategoryHash)
  ) {
    processMod.tag = getModTypeTagByPlugCategoryHash(mod.plug.plugCategoryHash);
  }

  return processMod;
}

/**
 * Turns a real DimItem, armor upgrade rules, and bucket specific mods into the bits of
 * information relevant for LO. This requires that bucket specific mods have been validated
 * before.
 */
export function mapDimItemToProcessItem({
  dimItem,
  armorEnergyRules,
  modsForSlot,
}: {
  dimItem: DimItem;
  armorEnergyRules: ArmorEnergyRules;
  modsForSlot?: PluggableInventoryItemDefinition[];
}): ProcessItem {
  const { id, hash, name, isExotic, power } = dimItem;

  const stats = calculateAssumedMasterworkStats(dimItem, armorEnergyRules);
  const capacity = calculateAssumedItemEnergy(dimItem, armorEnergyRules);
  const modMetadatas = getSpecialtySocketMetadatas(dimItem);
  const modsCost = modsForSlot
    ? sumBy(modsForSlot, (mod) => mod.plug.energyCost?.energyCost ?? 0)
    : 0;

  const assumeArtifice = isAssumedArtifice(dimItem, armorEnergyRules);

  return {
    id,
    hash,
    name,
    isExotic,
    isArtifice: assumeArtifice,
    power,
    stats,
    remainingEnergyCapacity: capacity - modsCost,
    compatibleModSeasons: modMetadatas?.map((m) => m.slotTag),
  };
}

export function hydrateArmorSet(
  processed: ProcessArmorSet,
  itemsById: Map<string, ItemGroup>,
): ArmorSet {
  const armor: DimItem[][] = [];

  for (const itemId of processed.armor) {
    armor.push(itemsById.get(itemId)!.items);
  }

  return {
    armor,
    stats: processed.stats,
    armorStats: processed.armorStats,
    statMods: processed.statMods,
  };
}

export function mapAutoMods(defs: AutoModDefs): AutoModData {
  const defToAutoMod = (def: PluggableInventoryItemDefinition) => ({
    hash: def.hash,
    cost: def.plug.energyCost?.energyCost ?? 0,
  });
  const defToArtificeMod = (def: PluggableInventoryItemDefinition) => ({
    hash: def.hash,
  });
  return {
    artificeMods: mapValues(defs.artificeMods, defToArtificeMod),
    generalMods: mapValues(defs.generalMods, (modsForStat) => mapValues(modsForStat, defToAutoMod)),
  };
}

/**
 * Build the automatically pickable mods for the store.
 * FIXME: Bungie created cheap copies of some mods, but they don't have stats, so
 * this code will not extract the reduced-cost copies even if they become available.
 * Re-evaluate this in future seasons if general mods can be affected by artifact cost reductions.
 */
export function getAutoMods(defs: D2ManifestDefinitions, allUnlockedPlugs: Set<number>) {
  const autoMods: AutoModDefs = { generalMods: {}, artificeMods: {} };
  // Only consider plugs that give stats
  const mapPlugSet = (plugSetHash: number) =>
    filterMap(defs.PlugSet.get(plugSetHash)?.reusablePlugItems ?? [], (plugEntry) => {
      const def = defs.InventoryItem.get(plugEntry.plugItemHash);
      return isPluggableItem(def) && def.investmentStats?.length ? def : undefined;
    });
  const generalPlugSet = mapPlugSet(generalSocketReusablePlugSetHash);
  const artificePlugSet = mapPlugSet(artificeSocketReusablePlugSetHash);

  for (const statHash of armorStats) {
    // Artifice mods give a small boost in a single stat, so find the mod for that stat
    const artificeMod = artificePlugSet.find((modDef) =>
      modDef.investmentStats.some(
        (stat) => stat.statTypeHash === statHash && stat.value === artificeStatBoost,
      ),
    );
    if (
      artificeMod &&
      (artificeMod.plug.energyCost === undefined || artificeMod.plug.energyCost.energyCost === 0)
    ) {
      autoMods.artificeMods[statHash] = artificeMod;
    }

    const findUnlockedModByValue = (value: number) => {
      const relevantMods = generalPlugSet.filter((def) =>
        def.investmentStats.find((stat) => stat.statTypeHash === statHash && stat.value === value),
      );
      relevantMods.sort(compareBy((def) => -(def.plug.energyCost?.energyCost ?? 0)));
      const [largeMod, smallMod] = relevantMods;
      return smallMod && allUnlockedPlugs.has(smallMod.hash) ? smallMod : largeMod;
    };

    const majorMod = findUnlockedModByValue(majorStatBoost);
    const minorMod = findUnlockedModByValue(minorStatBoost);
    if (majorMod && minorMod) {
      autoMods.generalMods[statHash] = { majorMod, minorMod };
    }
  }

  return autoMods;
}
