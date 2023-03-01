import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { getFirstSocketByCategoryHash } from 'app/utils/socket-utils';
import {
  DestinyInventoryItemDefinition,
  DestinyItemQuantity,
  PlugAvailabilityMode,
} from 'bungie-api-ts/destiny2';
import { PlugCategoryHashes, SocketCategoryHashes } from 'data/d2/generated-enums';
import _ from 'lodash';
import { DimItem } from '../item-types';

/**
 * OK, the rules are worse than this. An item gets a few options it can choose from -
 * upgrade by 1. It does this using mod items that are duplicated (different mods for regular items and exotics),
 * so you need to find the right mod from a set of possible identical copies. We can do this by looking at the socket's
 * reusablePlugSetHash.
 */
export function energyUpgrade(item: DimItem, newEnergyCapacity: number) {
  const tierSocket =
    item.sockets &&
    (getFirstSocketByCategoryHash(item.sockets, SocketCategoryHashes.ArmorTier) ||
      getFirstSocketByCategoryHash(item.sockets, SocketCategoryHashes.GhostTier));

  if (!tierSocket?.plugSet || !item.energy) {
    return [];
  }

  const oldEnergyCapacity = item.energy.energyCapacity ?? 1;
  const oldEnergyType = item.energy.energyType;

  const energyMods: DestinyInventoryItemDefinition[] = [];
  for (const dimPlug of tierSocket.plugSet.plugs) {
    const capacity = dimPlug.plugDef.plug.energyCapacity;
    if (!capacity) {
      continue;
    }

    const plugAvailability = dimPlug.plugDef.plug.plugAvailability;
    // We're looking for all the upgrade mods between here and there
    if (
      (dimPlug.plugDef.plug.plugCategoryHash ===
        PlugCategoryHashes.V460PlugsArmorMasterworksStatResistance2 ||
        dimPlug.plugDef.plug.plugCategoryHash === PlugCategoryHashes.PlugsGhostsMasterworks) &&
      capacity.energyType === oldEnergyType &&
      capacity.capacityValue > oldEnergyCapacity &&
      capacity.capacityValue <= newEnergyCapacity &&
      plugAvailability === PlugAvailabilityMode.AvailableIfSocketContainsMatchingPlugCategory
    ) {
      energyMods.push(dimPlug.plugDef);
    }
  }

  return _.sortBy(energyMods, (i) => i.plug!.energyCapacity!.capacityValue).map((i) => i.hash);
}

export function sumModCosts(
  defs: D2ManifestDefinitions,
  mods: DestinyInventoryItemDefinition[]
): DestinyItemQuantity[] {
  const costs: { [itemHash: number]: number } = {};
  for (const mod of mods) {
    if (!mod.plug) {
      continue;
    }
    const materials = defs.MaterialRequirementSet.get(mod.plug.insertionMaterialRequirementHash);
    for (const material of materials.materials) {
      costs[material.itemHash] ||= 0;
      costs[material.itemHash] += material.count;
    }
  }

  return Object.entries(costs).map(([itemHashStr, quantity]) => ({
    itemHash: parseInt(itemHashStr, 10),
    quantity,
    hasConditionalVisibility: false,
  }));
}
