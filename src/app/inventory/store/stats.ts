import {
  DestinyItemComponent,
  DestinyInventoryItemDefinition,
  DestinyItemStatsComponent,
  DestinyStatDefinition,
  DestinyStat,
  DestinyItemComponentSetOfint64,
  DestinyStatDisplayDefinition
} from 'bungie-api-ts/destiny2';
import { DimSockets, DimStat, D2Item, DimSocket, DimPlug } from '../item-types';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions.service';
import idx from 'idx';
import { compareBy } from 'app/comparators';
import { LazyDefinition } from 'app/destiny1/d1-definitions.service';
import { filterPlugs } from 'app/d2-loadout-builder/generated-sets/utils';
import _ from 'lodash';

/**
 * These are the utilities that deal with Stats on items - specifically, how to calculate them.
 *
 * This is called from within d2-item-factory.service.ts
 */

/**
 * Which stats to display, and in which order.
 */
export const statWhiteList = [
  4284893193, // Rounds Per Minute
  2961396640, // Charge Time
  3614673599, // Blast Radius
  2523465841, // Velocity
  4043523819, // Impact
  1240592695, // Range
  155624089, // Stability
  943549884, // Handling
  4188031367, // Reload Speed
  1345609583, // Aim Assistance
  3555269338, // Zoom
  2715839340, // Recoil Direction
  3871231066, // Magazine
  2996146975, // Mobility
  392767087, // Resilience
  1943323491, // Recovery
  447667954 // Draw Time
  //    1935470627, // Power
  // there are a few others (even an `undefined` stat)
];

/** Stats that should be displayed without a bar (just a number) */
const statsNoBar = [
  4284893193, // Rounds Per Minute
  3871231066, // Magazine
  2961396640, // Charge Time
  447667954, // Draw Time
  1931675084, // Inventory Size
  2715839340 // Recoil Direction
];

/** Additional "hidden" stats that don't come from the precalculated stats but which we still want to display. */
const hiddenStats = [
  1345609583, // Aim Assistance
  3555269338, // Zoom
  2715839340 // Recoil Direction
];

/** Stats that max at 5 instead of 100 */
const statsMax5 = [
  1943323491, // Recovery
  392767087, // Resilience
  2996146975 // Mobility
];

/** Built the full list of stats for an item. If the item has no stats, this returns null. */
export function buildStats(
  createdItem: D2Item,
  itemDef: DestinyInventoryItemDefinition,
  defs: D2ManifestDefinitions,
  item: DestinyItemComponent,
  itemComponents?: DestinyItemComponentSetOfint64
) {
  let stats: DimStat[] | null = null;

  const statsData = idx(itemComponents, (i) => i.stats.data);
  if (statsData) {
    // Instanced stats
    stats = buildPrecalculatedStats(item, createdItem.sockets, statsData, defs.Stat);
    if (itemDef.stats && itemDef.stats.stats) {
      // Hidden stats
      stats = (stats || []).concat(buildDefinitionStats(itemDef, defs.Stat, hiddenStats));
    }
  } else if (itemDef.stats && itemDef.stats.stats) {
    // Item definition stats
    stats = buildDefinitionStats(itemDef, defs.Stat);
  }
  // Investment stats (This never happens!)
  if (itemDef.investmentStats && itemDef.investmentStats.length) {
    let investmentStats = buildInvestmentStats(itemDef, defs);
    if (
      investmentStats &&
      investmentStats.length &&
      createdItem.sockets &&
      createdItem.sockets.sockets.length
    ) {
      investmentStats = enhanceStatsWithPlugs(
        investmentStats,
        createdItem.sockets.sockets,
        itemDef,
        defs
      );
    }
    stats = [...(stats || []), ...(investmentStats || [])];
  }

  return stats && stats.sort(compareBy((s) => s.sort));
}

/**
 * Instanced, precalculated stats.
 */
function buildPrecalculatedStats(
  item: DestinyItemComponent,
  sockets: DimSockets | null,
  stats: { [key: string]: DestinyItemStatsComponent },
  statDefs: LazyDefinition<DestinyStatDefinition>
): DimStat[] {
  if (!item.itemInstanceId || !stats[item.itemInstanceId]) {
    return [];
  }
  const itemStats = stats[item.itemInstanceId].stats;

  // determine bonuses for armor
  const statBonuses = {};
  if (sockets) {
    const bonusPerk = sockets.sockets.find((socket) =>
      Boolean(
        // Mobility, Restorative, and Resilience perk
        idx(socket.plug, (p) => p.plugItem.plug.plugCategoryHash) === 3313201758
      )
    );
    // If we didn't find one, then it's not armor.
    if (bonusPerk) {
      statBonuses[bonusPerk.plug!.plugItem.investmentStats[0].statTypeHash] = {
        plugs: bonusPerk.plug!.plugItem.investmentStats[0].value,
        perks: 0,
        mods: 0
      };

      // Custom applied mods
      sockets.sockets
        .filter((socket) =>
          Boolean(
            idx(socket.plug, (p) => p.plugItem.plug.plugCategoryHash) === 3347429529 &&
              idx(socket.plug, (p) => p.plugItem.inventory.tierType) !== 2
          )
        )
        .forEach((socket) => {
          const bonusPerkStat = socket.plug!.plugItem.investmentStats[0];
          if (bonusPerkStat) {
            if (!statBonuses[bonusPerkStat.statTypeHash]) {
              statBonuses[bonusPerkStat.statTypeHash] = { mods: 0 };
            }
            statBonuses[bonusPerkStat.statTypeHash].mods += bonusPerkStat.value;
          }
        });

      // Look for perks that modify stats (ie. Traction 1818103563)
      sockets.sockets
        .filter((socket) =>
          Boolean(
            filterPlugs(socket) &&
              idx(socket.plug, (p) => p.plugItem.plug.plugCategoryHash) !== 3347429529 &&
              idx(socket.plug, (p) => p.plugItem.investmentStats.length)
          )
        )
        .forEach((socket) => {
          const bonusPerkStat = socket.plug!.plugItem.investmentStats[0];
          if (bonusPerkStat) {
            if (!statBonuses[bonusPerkStat.statTypeHash]) {
              statBonuses[bonusPerkStat.statTypeHash] = { perks: 0 };
            }
            statBonuses[bonusPerkStat.statTypeHash].perks += bonusPerkStat.value;
          }
        });
    }
  }

  return _.compact(
    Object.values(itemStats).map((stat: DestinyStat): DimStat | undefined => {
      const def = statDefs.get(stat.statHash);
      const itemStat = itemStats[stat.statHash];
      if (!def || !itemStat) {
        return undefined;
      }

      const value = (itemStat ? itemStat.value : stat.value) || 0;
      let base = value;
      let bonus = 0;
      let plugBonus = 0;
      let modsBonus = 0;
      let perkBonus = 0;
      if (statBonuses[stat.statHash]) {
        plugBonus = statBonuses[stat.statHash].plugs || 0;
        modsBonus = statBonuses[stat.statHash].mods || 0;
        perkBonus = statBonuses[stat.statHash].perks || 0;
        bonus = plugBonus + perkBonus + modsBonus;
        base -= bonus;
      }

      return {
        base,
        investmentValue: base,
        statHash: stat.statHash,
        name: def.displayProperties.name,
        id: stat.statHash,
        sort: statWhiteList.indexOf(stat.statHash),
        value,
        maximumValue: itemStat.maximumValue,
        bar: !statsNoBar.includes(stat.statHash)
      };
    })
  );
}

/**
 * Build stats from the non-pre-sized investment stats.
 */
function buildInvestmentStats(
  itemDef: DestinyInventoryItemDefinition,
  defs: D2ManifestDefinitions
): DimStat[] | null {
  const itemStats = itemDef.investmentStats;
  if (!itemDef.stats || !itemDef.stats.statGroupHash) {
    return null;
  }
  const statGroup = defs.StatGroup.get(itemDef.stats.statGroupHash);
  if (!statGroup) {
    return null;
  }

  const statDisplays = _.keyBy(statGroup.scaledStats, (s) => s.statHash);

  // TODO: armor always has stats but they maybe come from perks
  // TODO: loadout optimizer is only counting bonuses from switchable perks

  return _.compact(
    Object.values(itemStats).map((itemStat): DimStat | undefined => {
      const statHash = itemStat.statTypeHash;
      if (!itemStat || !statWhiteList.includes(statHash)) {
        return undefined;
      }

      const def = defs.Stat.get(statHash);
      if (!def) {
        return undefined;
      }

      let value = itemStat.value || 0;
      let maximumValue = statGroup.maximumValue;
      let bar = !statsNoBar.includes(statHash);
      const statDisplay = statDisplays[statHash];
      if (statDisplay) {
        maximumValue = statDisplay.maximumValue;
        bar = !statDisplay.displayAsNumeric;
        value = interpolateStatValue(value, statDisplay);
      }

      return {
        base: value,
        investmentValue: itemStat.value || 0,
        statHash,
        // TODO: replace with displayProperties
        name: '_' + def.displayProperties.name,
        id: itemStat.statTypeHash,
        sort: statWhiteList.indexOf(statHash),
        value,
        maximumValue,
        bar
      };
    })
  );
}

function interpolateStatValue(value: number, statDisplay: DestinyStatDisplayDefinition) {
  // Some stats have an item-specific interpolation table, which is defined as
  // a piecewise linear function mapping input stat values to output stat values.
  const interp = statDisplay.displayInterpolation;
  const startIndex = Math.max(0, interp.findIndex((p) => p.value > value) - 1);
  const endIndex = Math.min(startIndex + 1, interp.length - 1);

  const start = interp[startIndex];
  const end = interp[endIndex];
  const t = Math.min(1.0, (value - start.value) / (end.value - start.value));

  return Math.round(start.weight + t * (end.weight - start.weight));
}

/**
 * Stats that come from the base definition - we have no info about how they apply to an instance.
 *
 * This will only include stats whose hashes are on the provided whitelist.
 */
function buildDefinitionStats(
  itemDef: DestinyInventoryItemDefinition,
  statDefs: LazyDefinition<DestinyStatDefinition>,
  whitelist: number[] = statWhiteList
): DimStat[] {
  const itemStats = itemDef.stats.stats;

  if (!itemStats) {
    return [];
  }

  return _.compact(
    Object.values(itemStats).map((stat): DimStat | undefined => {
      const def = statDefs.get(stat.statHash);

      if (stat.value === undefined || !whitelist.includes(stat.statHash)) {
        return undefined;
      }

      return {
        base: stat.value,
        investmentValue: stat.value,
        statHash: stat.statHash,
        name: def.displayProperties.name,
        id: stat.statHash,
        sort: statWhiteList.indexOf(stat.statHash),
        value: stat.value,
        // Armor stats max out at 5, all others are... probably 100? See https://github.com/Bungie-net/api/issues/448
        maximumValue: statsMax5.includes(stat.statHash) ? 5 : 100,
        bar: !statsNoBar.includes(stat.statHash)
      };
    })
  );
}

function enhanceStatsWithPlugs(
  stats: DimStat[],
  sockets: DimSocket[],
  itemDef: DestinyInventoryItemDefinition,
  defs: D2ManifestDefinitions
) {
  if (!itemDef.stats || !itemDef.stats.statGroupHash) {
    return stats;
  }
  const statGroup = defs.StatGroup.get(itemDef.stats.statGroupHash);
  if (!statGroup) {
    return stats;
  }

  // TODO: calculate this once...
  const statDisplays = _.keyBy(statGroup.scaledStats, (s) => s.statHash);
  const statsByHash = _.keyBy(stats, (s) => s.statHash);

  for (const socket of sockets) {
    for (const plug of socket.plugOptions) {
      if (plug.plugItem && plug.plugItem.investmentStats && plug.plugItem.investmentStats.length) {
        plug.stats = buildPlugStats(
          plug,
          statsByHash,
          statDisplays,
          itemDef.displayProperties.name
        );

        if (plug === socket.plug) {
          _.forIn(plug.stats, (value, statHash) => {
            const itemStat = statsByHash[statHash];
            if (!itemStat) {
              // TODO add the stat!
            } else {
              /*
              console.log(
                itemDef.displayProperties.name,
                defs.Stat.get(parseInt(statHash, 10)).displayProperties.name,
                value,
                plug.stats
              );
              */
              itemStat.value += value;
            }
          });
        }
      }
    }
  }

  return stats;
}

function buildPlugStats(
  plug: DimPlug,
  statsByHash: { [statHash: number]: DimStat },
  statDisplays: { [statHash: number]: DestinyStatDisplayDefinition },
  name: string
) {
  const stats: {
    [statHash: number]: number;
  } = {};

  for (const perkStat of plug.plugItem.investmentStats) {
    let value = perkStat.value || 0;
    const itemStat = statsByHash[perkStat.statTypeHash];
    const statDisplay = statDisplays[perkStat.statTypeHash];
    if (itemStat && statDisplay) {
      // This is a scaled stat, so we need to scale it in context of the original investment stat
      const valueWithPerk = interpolateStatValue(value + itemStat.investmentValue, statDisplay);
      /*
      console.log(
        name,
        perkStat.statTypeHash,
        value,
        itemStat.investmentValue,
        itemStat.base,
        valueWithPerk,
        statDisplay.displayInterpolation
      );
      */
      value = valueWithPerk - itemStat.base;
    }
    stats[perkStat.statTypeHash] = value;
  }

  return stats;
}
