import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import {
  DestinyEnergyType,
  DestinyInventoryItemDefinition,
  DestinyItemQuantity,
} from 'bungie-api-ts/destiny2';
import changeEnergyMods from 'data/d2/energy-mods-change.json';
import energyMods from 'data/d2/energy-mods.json';

export function energyUpgrade(
  oldEnergyType: DestinyEnergyType,
  oldEnergyCapacity: number,
  newEnergyType: DestinyEnergyType,
  newEnergyCapacity: number
) {
  const upgradeModHashes =
    oldEnergyType === newEnergyType
      ? energyMods[newEnergyType].slice(oldEnergyCapacity, newEnergyCapacity)
      : [changeEnergyMods[newEnergyType][newEnergyCapacity - 1]];

  return upgradeModHashes;
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
