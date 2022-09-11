import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { getFirstSocketByCategoryHash } from 'app/utils/socket-utils';
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
 *
 * TODO(ryan): I don't think old energy type and capacity are needed, they can be calculated from the item.
 */
export function energyUpgrade(
  item: DimItem,
  oldEnergyType: DestinyEnergyType,
  oldEnergyCapacity: number,
  newEnergyType: DestinyEnergyType,
  newEnergyCapacity: number
) {
  let tierSocket;
  const armorTierSocket =
    item.sockets && getFirstSocketByCategoryHash(item.sockets, SocketCategoryHashes.ArmorTier);
  const ghostTierSocket =
    item.sockets && getFirstSocketByCategoryHash(item.sockets, SocketCategoryHashes.GhostTier);
  const tierSocket = armorTierSocket?.plugSet ? armorTierSocket : ghostTierSocket;
  // We want to display energy info for ghosts
  if (!armorTierSocket?.plugSet) {
    tierSocket = ghostTierSocket;
  }
  if (!tierSocket?.plugSet) {
    return [];
  }

  const energyMods: DestinyInventoryItemDefinition[] = [];
  for (const dimPlug of tierSocket.plugSet.plugs) {
    const capacity = dimPlug.plugDef.plug.energyCapacity;
    if (!capacity) {
      continue;
    }

    const plugAvailability = dimPlug.plugDef.plug.plugAvailability;
    if (oldEnergyType === newEnergyType) {
      // We're looking for all the upgrade mods between here and there
      if (
        capacity.energyType === newEnergyType &&
        capacity.capacityValue > oldEnergyCapacity &&
        capacity.capacityValue <= newEnergyCapacity &&
        plugAvailability === PlugAvailabilityMode.AvailableIfSocketContainsMatchingPlugCategory
      ) {
        energyMods.push(dimPlug.plugDef);
      }
    } else if (
      // We're looking for the exact capacity at a different energy type
      capacity.energyType === newEnergyType &&
      capacity.capacityValue === newEnergyCapacity &&
      plugAvailability !== PlugAvailabilityMode.AvailableIfSocketContainsMatchingPlugCategory
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
