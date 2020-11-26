import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import {
  DestinyEnergyType,
  DestinyInventoryItemDefinition,
  DestinyItemQuantity,
  PlugAvailabilityMode,
} from 'bungie-api-ts/destiny2';
import { SocketCategoryHashes } from 'data/d2/generated-enums';
import _ from 'lodash';
import { DimItem } from '../item-types';

/**
 * OK, the rules are worse than this. An item only gets a few options it can choose from -
 * upgrade by 1, switch to another element at capacity 1, or switch to another element at the
 * same capacity. It does this using mod items that are duplicated (different mods for regular items and exotics),
 * so you need to find the right mod from a set of possible identical copies. We can do this by looking at the socket's
 * reusablePlugSetHash.
 */
export function energyUpgrade(
  defs: D2ManifestDefinitions,
  item: DimItem,
  oldEnergyType: DestinyEnergyType,
  oldEnergyCapacity: number,
  newEnergyType: DestinyEnergyType,
  newEnergyCapacity: number
) {
  const tierSocket = item.sockets!.categories.find(
    (c) => c.category.hash === SocketCategoryHashes.ArmorTier
  )!.sockets[0];

  const plugSet = defs.PlugSet.get(tierSocket.socketDefinition.reusablePlugSetHash!);

  const energyMods: DestinyInventoryItemDefinition[] = [];
  for (const { plugItemHash } of plugSet.reusablePlugItems) {
    const plugItem = defs.InventoryItem.get(plugItemHash);

    const capacity = plugItem.plug?.energyCapacity;
    if (!plugItem.plug || !capacity) {
      continue;
    }

    const plugAvailability = plugItem.plug.plugAvailability;
    if (oldEnergyType === newEnergyType) {
      // We're looking for all the upgrade mods between here and there
      if (
        capacity.energyType === newEnergyType &&
        capacity.capacityValue > oldEnergyCapacity &&
        capacity.capacityValue <= newEnergyCapacity &&
        plugAvailability === PlugAvailabilityMode.AvailableIfSocketContainsMatchingPlugCategory
      ) {
        energyMods.push(plugItem);
      }
    } else if (
      // We're looking for the exact capacity at a different energy type
      capacity.energyType === newEnergyType &&
      capacity.capacityValue === newEnergyCapacity &&
      plugAvailability !== PlugAvailabilityMode.AvailableIfSocketContainsMatchingPlugCategory
    ) {
      energyMods.push(plugItem);
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
  }));
}
