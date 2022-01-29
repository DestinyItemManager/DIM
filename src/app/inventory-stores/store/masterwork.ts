import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { isPlugStatActive } from 'app/utils/item-utils';
import { isWeaponMasterworkSocket } from 'app/utils/socket-utils';
import { DamageType } from 'bungie-api-ts/destiny2';
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
  const socket = sockets.allSockets.find(isWeaponMasterworkSocket);
  if (!socket || !socket.plugged) {
    return null;
  }
  const investmentStats = socket.plugged.plugDef.investmentStats;

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
        socket.plugged.plugDef.hash,
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
      value: socket.plugged?.stats?.[stat.statTypeHash] || 0,
    });
  }

  return {
    tier: exoticWeapon ? maxTier : Math.abs(socket.plugged?.plugDef.investmentStats[0].value),
    stats,
  };
}
