import {
  DestinyItemComponent,
  DestinyInventoryItemDefinition,
  DestinyItemStatsComponent,
  DestinyStatDefinition,
  DestinyStat,
  DestinyItemInvestmentStatDefinition,
  DestinyItemComponentSetOfint64
} from 'bungie-api-ts/destiny2';
import { DimSockets, DimStat, D2Item } from '../item-types';
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
const statWhiteList = [
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
  447667954, // Draw Time
  1931675084 // Inventory Size
  //    1935470627, // Power
  // there are a few others (even an `undefined` stat)
];

/** Stats that should be displayed without a bar (just a number) */
const statsNoBar = [
  4284893193, // Rounds Per Minute
  3871231066, // Magazine
  2961396640, // Charge Time
  447667954, // Draw Time
  1931675084 // Inventory Size
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
      stats = (createdItem.stats || []).concat(
        buildDefinitionStats(itemDef, defs.Stat, hiddenStats)
      );
    }
  } else if (itemDef.stats && itemDef.stats.stats) {
    // Item definition stats
    stats = buildDefinitionStats(itemDef, defs.Stat, statWhiteList);
  }
  // Investment stats
  if (!createdItem.stats && itemDef.investmentStats && itemDef.investmentStats.length) {
    stats = buildInvestmentStats(itemDef.investmentStats, defs.Stat);
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

      const value = itemStat ? itemStat.value : stat.value;
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
        bonus,
        plugBonus,
        modsBonus,
        perkBonus,
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
  itemStats: DestinyItemInvestmentStatDefinition[],
  statDefs: LazyDefinition<DestinyStatDefinition>
): DimStat[] {
  return _.compact(
    _.map(itemStats, (itemStat): DimStat | undefined => {
      const def = statDefs.get(itemStat.statTypeHash);
      /* 1935470627 = Power */
      if (!def || !itemStat || itemStat.statTypeHash === 1935470627) {
        return undefined;
      }

      return {
        base: itemStat.value,
        bonus: 0,
        statHash: itemStat.statTypeHash,
        name: def.displayProperties.name,
        id: itemStat.statTypeHash,
        sort: statWhiteList.indexOf(itemStat.statTypeHash),
        value: itemStat.value,
        maximumValue: 0,
        bar: !statsNoBar.includes(itemStat.statTypeHash)
      };
    })
  );
}

/**
 * Stats that come from the base definition - we have no info about how they apply to an instance.
 */
function buildDefinitionStats(
  itemDef: DestinyInventoryItemDefinition,
  statDefs: LazyDefinition<DestinyStatDefinition>,
  statWhiteList: number[]
): DimStat[] {
  const itemStats = itemDef.stats.stats;

  if (!itemStats) {
    return [];
  }

  return _.compact(
    Object.values(itemStats).map((stat): DimStat | undefined => {
      const def = statDefs.get(stat.statHash);

      if (!stat.value || !statWhiteList.includes(stat.statHash)) {
        return undefined;
      }

      return {
        base: stat.value,
        bonus: 0,
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
