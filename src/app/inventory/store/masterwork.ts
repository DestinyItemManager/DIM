import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { DamageType } from 'bungie-api-ts/destiny2';
import { D2Item, DimMasterwork, DimSockets } from '../item-types';

/**
 * These are the utilities that deal with figuring out Masterwork info.
 *
 * This is called from within d2-item-factory.service.ts
 */

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
  createdItem: D2Item,
  defs: D2ManifestDefinitions
): DimMasterwork | null {
  if (!createdItem.sockets) {
    return null;
  }

  let masterworkInfo: DimMasterwork | null = null;

  // Pre-Forsaken Masterwork
  if (createdItem.masterwork) {
    masterworkInfo = buildMasterworkInfo(createdItem.sockets, defs);
  }

  // Forsaken Masterwork
  if (!masterworkInfo) {
    masterworkInfo = buildForsakenMasterworkStats(createdItem, defs);
  }

  return masterworkInfo;
}

function buildForsakenMasterworkStats(
  createdItem: D2Item,
  defs: D2ManifestDefinitions
): DimMasterwork | null {
  const masterworkSocket = createdItem.sockets!.allSockets.find((socket) =>
    Boolean(
      socket.plugged?.plugDef.plug &&
        (socket.plugged.plugDef.plug.plugCategoryIdentifier.includes('masterworks.stat') ||
          socket.plugged.plugDef.plug.plugCategoryIdentifier.endsWith('_masterwork'))
    )
  );
  if (masterworkSocket?.plugged?.plugDef.investmentStats.length) {
    const masterwork = masterworkSocket.plugged.plugDef.investmentStats[0];
    if (!createdItem.element && createdItem.bucket?.sort === 'Armor') {
      createdItem.element =
        Object.values(defs.DamageType).find(
          (damageType) => damageType.enumValue === resistanceMods[masterwork.statTypeHash]
        ) ?? null;
    }

    return {
      tier: masterwork.value,
      stats: [
        {
          hash: masterwork.statTypeHash,
          name: defs.Stat.get(masterwork.statTypeHash).displayProperties.name,
          value: masterworkSocket.plugged.stats?.[masterwork.statTypeHash] || 0,
        },
      ],
    };
  }
  return null;
}

/**
 * Pre-Forsaken weapons store their masterwork info on an objective of a plug.
 */
function buildMasterworkInfo(
  sockets: DimSockets,
  defs: D2ManifestDefinitions
): DimMasterwork | null {
  const socket = sockets.allSockets.find((socket) =>
    Boolean(socket.plugged?.plugObjectives.length)
  );
  if (!socket?.plugged?.plugObjectives?.length) {
    return null;
  }
  const plugObjective = socket.plugged.plugObjectives[0];
  const investmentStats = socket.plugged.plugDef.investmentStats;
  const objectiveDef = defs.Objective.get(plugObjective.objectiveHash);

  if (!investmentStats?.length || !objectiveDef) {
    return null;
  }

  const stats = investmentStats.map((stat) => ({
    hash: stat.statTypeHash,
    name: defs.Stat.get(stat.statTypeHash).displayProperties.name,
    value: socket.plugged?.stats?.[stat.statTypeHash] || 0,
  }));

  return {
    tier: socket.plugged?.plugDef.investmentStats[0].value,
    stats,
  };
}
