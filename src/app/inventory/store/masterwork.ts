import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { isEmpty } from 'app/utils/collections';
import { isEdgeOfFateArmorMasterworkSocket } from 'app/utils/item-utils';
import { getFirstSocketByCategoryHash, isWeaponMasterworkSocket } from 'app/utils/socket-utils';
import { DestinyInventoryItemDefinition } from 'bungie-api-ts/destiny2';
import enhancedIntrinsics from 'data/d2/crafting-enhanced-intrinsics';
import { ItemCategoryHashes, SocketCategoryHashes, StatHashes } from 'data/d2/generated-enums';
import masterworksWithCondStats from 'data/d2/masterworks-with-cond-stats.json';
import { DimItem, DimMasterwork, DimSockets } from '../item-types';

/**
 * These are the utilities that deal with figuring out Masterwork info.
 *
 * This is called from within d2-item-factory.service.ts
 */

const maxTier = 10;

/**
 * This builds the masterwork info - this isn't whether an item is masterwork, but instead what
 * "type" of masterwork it is, what the kill tracker value is, etc. Exotic weapons can start having
 * kill trackers before they're masterworked.
 */
export function buildMasterwork(
  createdItem: DimItem,
  defs: D2ManifestDefinitions,
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
  defs: D2ManifestDefinitions,
): DimMasterwork | null {
  // For crafted weapons, the enhanced intrinsic provides masterwork-like stats
  let masterworkPlug =
    (createdItem.crafted &&
      getFirstSocketByCategoryHash(sockets, SocketCategoryHashes.IntrinsicTraits)?.plugged) ||
    sockets.allSockets.find(isWeaponMasterworkSocket)?.plugged;

  // Look for the Edge of Fate masterwork socket
  if (!masterworkPlug && createdItem.bucket.inArmor) {
    masterworkPlug = createdItem.sockets?.allSockets.find(
      isEdgeOfFateArmorMasterworkSocket,
    )?.plugged;
  }

  if (!masterworkPlug) {
    return null;
  }
  const plugStats = masterworkPlug.stats;

  const exoticWeapon = createdItem.isExotic && createdItem.bucket?.sort === 'Weapons';

  if (!plugStats || isEmpty(plugStats)) {
    if (exoticWeapon) {
      return {
        tier: maxTier,
        stats: undefined,
      };
    }
    return null;
  }

  const stats: DimMasterwork['stats'] = [];

  const primaryMWStatHash =
    enhancedIntrinsics.has(masterworkPlug.plugDef.hash) ||
    masterworksWithCondStats.includes(masterworkPlug.plugDef.hash)
      ? masterworkPlug.plugDef.investmentStats[0]?.statTypeHash
      : undefined;

  for (const [statHash_, stat] of Object.entries(plugStats)) {
    const statHash = parseInt(statHash_, 10);
    if (!createdItem.stats?.some((s) => s.statHash === statHash)) {
      continue;
    }
    stats.push({
      hash: statHash,
      name: defs.Stat.get(statHash).displayProperties.name,
      value: stat.value,
      isPrimary: primaryMWStatHash === undefined || primaryMWStatHash === statHash,
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
  statHash: number,
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
