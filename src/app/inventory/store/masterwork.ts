import { D2Item, DimSockets, DimMasterwork } from '../item-types';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { DamageType } from 'bungie-api-ts/destiny2';

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
    masterworkInfo = buildForsakenMasterworkInfo(createdItem, defs);
  }

  return masterworkInfo;
}

/**
 * Post-Forsaken weapons store their masterwork info and kill tracker on different plugs.
 */
function buildForsakenMasterworkInfo(
  createdItem: D2Item,
  defs: D2ManifestDefinitions
): DimMasterwork | null {
  const masterworkStats = buildForsakenMasterworkStats(createdItem, defs);
  const killTracker = buildForsakenKillTracker(createdItem, defs);

  // override stats values with killtracker if it's available
  if (masterworkStats && killTracker) {
    return { ...masterworkStats, ...killTracker };
  }
  return masterworkStats || killTracker || null;
}

function buildForsakenKillTracker(
  createdItem: D2Item,
  defs: D2ManifestDefinitions
): DimMasterwork | null {
  const killTrackerSocket = createdItem.sockets!.sockets.find((socket) =>
    Boolean(socket.plug?.plugObjectives?.length)
  );

  if (killTrackerSocket?.plug?.plugObjectives?.length) {
    const plugObjective = killTrackerSocket.plug.plugObjectives[0];

    const objectiveDef = defs.Objective.get(plugObjective.objectiveHash);

    return {
      progress: plugObjective.progress,
      typeIcon: objectiveDef.displayProperties.icon,
      typeDesc: objectiveDef.progressDescription,
      typeName: [3244015567, 2285636663, 38912240].includes(killTrackerSocket.plug.plugItem.hash)
        ? 'Crucible'
        : 'Vanguard',
    };
  }
  return null;
}
function buildForsakenMasterworkStats(
  createdItem: D2Item,
  defs: D2ManifestDefinitions
): DimMasterwork | null {
  const masterworkSocket = createdItem.sockets!.sockets.find((socket) =>
    Boolean(
      socket.plug?.plugItem.plug &&
        (socket.plug.plugItem.plug.plugCategoryIdentifier.includes('masterworks.stat') ||
          socket.plug.plugItem.plug.plugCategoryIdentifier.endsWith('_masterwork'))
    )
  );
  if (masterworkSocket?.plug?.plugItem.investmentStats.length) {
    const masterwork = masterworkSocket.plug.plugItem.investmentStats[0];
    if (!createdItem.element && createdItem.bucket?.sort === 'Armor') {
      createdItem.element =
        Object.values(defs.DamageType).find(
          (damageType) => damageType.enumValue === resistanceMods[masterwork.statTypeHash]
        ) ?? null;
    }

    const statDef = defs.Stat.get(masterwork.statTypeHash);

    return {
      typeName: null,
      typeIcon: masterworkSocket.plug.plugItem.displayProperties.icon,
      typeDesc: masterworkSocket.plug.plugItem.displayProperties.description,
      tier: masterwork.value,
      stats: {
        hash: masterwork.statTypeHash,
        name: statDef.displayProperties.name,
        value: masterworkSocket.plug.stats?.[masterwork.statTypeHash] || 0,
      }[0],
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
  const socket = sockets.sockets.find((socket) => Boolean(socket.plug?.plugObjectives.length));
  if (!socket?.plug?.plugObjectives?.length) {
    return null;
  }
  const plugObjective = socket.plug.plugObjectives[0];
  const investmentStats = socket.plug.plugItem.investmentStats;
  const objectiveDef = defs.Objective.get(plugObjective.objectiveHash);

  if (!investmentStats?.length || !objectiveDef) {
    return null;
  }

  const stats = investmentStats.map((stat) => ({
    hash: stat.statTypeHash,
    name: defs.Stat.get(stat.statTypeHash).displayProperties.name,
    value: socket.plug?.stats?.[stat.statTypeHash] || 0,
  }));

  return {
    progress: plugObjective.progress,
    typeName: socket.plug.plugItem.plug.plugCategoryHash === 2109207426 ? 'Vanguard' : 'Crucible',
    typeIcon: objectiveDef.displayProperties.icon,
    typeDesc: objectiveDef.progressDescription,
    tier: socket.plug?.plugItem.investmentStats[0].value,
    stats,
  };
}
