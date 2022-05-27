import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { isPlugStatActive } from 'app/utils/item-utils';
import { getFirstSocketByCategoryHash, isWeaponMasterworkSocket } from 'app/utils/socket-utils';
import { DamageType, DestinyInventoryItemDefinition } from 'bungie-api-ts/destiny2';
import { ItemCategoryHashes, SocketCategoryHashes, StatHashes } from 'data/d2/generated-enums';
import { DimItem, DimMasterwork, DimSockets } from '../item-types';

/**
 * These are the utilities that deal with figuring out Masterwork info.
 *
 * This is called from within d2-item-factory.service.ts
 */

const maxTier = 10;

const resistanceMods = {
  1546607977: DamageType.Kinetic,
  1546607980: DamageType.Void,
  1546607978: DamageType.Arc,
  1546607979: DamageType.Thermal,
};

/**
 * This builds the masterwork info - this isn't whether an item is masterwork, but instead what
 * "type" of masterwork it is, what the kill tracker value is, etc. Exotic weapons can start having
 * kill trackers before they're masterworked.
 */
export function buildMasterwork(
  createdItem: DimItem,
  defs: D2ManifestDefinitions
): DimMasterwork | null {
  if (!createdItem.sockets) {
    return null;
  }

  return buildMasterworkInfo(createdItem, createdItem.sockets, defs);
}

/**
 * Figure out what tier the masterwork is at, if any, and what stats are affected.
 */
function buildMasterworkInfo(
  createdItem: DimItem,
  sockets: DimSockets,
  defs: D2ManifestDefinitions
): DimMasterwork | null {
  // For crafted weapons, the enhanced intrinsic provides masterwork-like stats
  const masterworkPlug =
    (createdItem.crafted &&
      getFirstSocketByCategoryHash(sockets, SocketCategoryHashes.IntrinsicTraits)?.plugged) ||
    sockets.allSockets.find(isWeaponMasterworkSocket)?.plugged;
  if (!masterworkPlug) {
    return null;
  }
  const investmentStats = masterworkPlug.plugDef.investmentStats;

  const exoticWeapon = createdItem.isExotic && createdItem.bucket?.sort === 'Weapons';

  if (!investmentStats?.length) {
    if (exoticWeapon) {
      return {
        tier: maxTier,
        stats: undefined,
      };
    }
    return null;
  }

  const stats: DimMasterwork['stats'] = [];

  for (const stat of investmentStats) {
    if (
      !isPlugStatActive(
        createdItem,
        masterworkPlug.plugDef.hash,
        stat.statTypeHash,
        stat.isConditionallyActive
      )
    ) {
      continue;
    }
    if (!createdItem.element && createdItem.bucket?.sort === 'Armor') {
      createdItem.element =
        Object.values(defs.DamageType.getAll()).find(
          (damageType) => damageType.enumValue === resistanceMods[stat.statTypeHash]
        ) ?? null;
    }
    stats.push({
      hash: stat.statTypeHash,
      name: defs.Stat.get(stat.statTypeHash).displayProperties.name,
      value: masterworkPlug.stats?.[stat.statTypeHash] || 0,
    });
  }

  return {
    tier: exoticWeapon ? maxTier : Math.abs(masterworkPlug.plugDef.investmentStats[0].value),
    stats,
  };
}

/**
 * Determine if a masterwork with this primary stat would be a valid
 * masterwork for this item.
 */
export function isValidMasterworkStat(
  defs: D2ManifestDefinitions,
  itemDef: DestinyInventoryItemDefinition,
  statHash: number
) {
  // Bows have a charge time stat that nobody asked for
  if (
    statHash === StatHashes.ChargeTime &&
    itemDef.itemCategoryHashes?.includes(ItemCategoryHashes.Bows)
  ) {
    return false;
  }

  // Only swords have an impact masterwork
  if (
    statHash === StatHashes.Impact &&
    !itemDef.itemCategoryHashes?.includes(ItemCategoryHashes.Sword)
  ) {
    return false;
  }

  const statGroupHash = itemDef.stats!.statGroupHash!;
  const statGroupDef = defs.StatGroup.get(statGroupHash);

  return statGroupDef.scaledStats.some((s) => s.statHash === statHash);
}
