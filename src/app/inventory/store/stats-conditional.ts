import { EXOTIC_CATALYST_TRAIT, modsWithConditionalStats } from 'app/search/d2-known-values';
import { infoLog, warnLog } from 'app/utils/log';
import { filterMap, uniqBy, weakMemoize } from 'app/utils/util';
import {
  DestinyClass,
  DestinyInventoryItemDefinition,
  DestinyItemInvestmentStatDefinition,
} from 'bungie-api-ts/destiny2';
import adeptWeaponHashes from 'data/d2/adept-weapon-hashes.json';
import enhancedIntrinsics from 'data/d2/crafting-enhanced-intrinsics';
import { PlugCategoryHashes, StatHashes } from 'data/d2/generated-enums';
import masterworksWithCondStats from 'data/d2/masterworks-with-cond-stats.json';
import {
  DimItem,
  DimPlugInvestmentStat,
  PlugStatActivityRule,
  PluggableInventoryItemDefinition,
} from '../item-types';

/**
 * For a given plug `itemDef` and a `stat`, statically figure out under which conditions
 * a given `stat` in that itemDef's `investmentStats` is active. Returns undefined
 * when the stat is always active.
 */
function getPlugInvestmentStatActivityRule(
  itemDef: DestinyInventoryItemDefinition,
  stat: DestinyItemInvestmentStatDefinition
): PlugStatActivityRule | undefined {
  // Some Exotic weapon catalysts can be inserted even though the catalyst objectives are incomplete.
  // In these cases, the catalyst effects are only applied once the objectives are complete.
  // We'll assume that the item can only be masterworked if its associated catalyst has been completed.
  if (itemDef.traitHashes?.includes(EXOTIC_CATALYST_TRAIT)) {
    return { rule: 'masterwork' };
  }

  // When adding new conditions here that bypass `stat.isConditionallyActive`, update
  // the fast path below.

  if (!stat.isConditionallyActive) {
    // always active
    return undefined;
  }

  // These are preview stats for the Adept enhancing plugs to indicate that enhancing
  // implicitly upgrades the masterwork to T10
  if (itemDef.plug?.plugCategoryHash === PlugCategoryHashes.CraftingPlugsWeaponsModsEnhancers) {
    return { rule: 'never' };
  }

  const defHash = itemDef.hash;
  if (
    defHash === modsWithConditionalStats.elementalCapacitor ||
    defHash === modsWithConditionalStats.enhancedElementalCapacitor
  ) {
    return { rule: 'never' };
  }

  if (
    defHash === modsWithConditionalStats.echoOfPersistence ||
    defHash === modsWithConditionalStats.sparkOfFocus
  ) {
    // "-10 to the stat that governs your class ability recharge"
    const classType =
      stat.statTypeHash === StatHashes.Mobility
        ? DestinyClass.Hunter
        : stat.statTypeHash === StatHashes.Resilience
        ? DestinyClass.Titan
        : stat.statTypeHash === StatHashes.Recovery
        ? DestinyClass.Warlock
        : undefined;
    if (classType === undefined) {
      warnLog('plug stats', 'unknown stat effect in', defHash, itemDef.displayProperties?.name);
      return undefined;
    }
    return { rule: 'classType', classType };
  }

  if (masterworksWithCondStats.includes(defHash)) {
    return { rule: 'adeptWeapon' };
  }

  if (enhancedIntrinsics.has(defHash)) {
    return { rule: 'enhancedIntrinsic' };
  }
}

/**
 * This function indicates whether a mod's stat effect is active on the item.
 *
 * For example, some subclass plugs reduce a different stat per character class,
 * which we identify using the passed subclass item, or the classType for static
 * setups that do not include a particular item.
 */
export function isPlugStatActive(
  rule: PlugStatActivityRule,
  item: DimItem | undefined,
  classType?: DestinyClass
): boolean {
  if (!rule) {
    return true;
  }

  const warnMissingItem = () => {
    warnLog('conditional stats', 'stat condition depends on item but we do not have an item here');
    return true;
  };
  switch (rule.rule) {
    case 'never':
      return false;
    case 'classType':
      classType ??= item?.classType;
      if (classType === undefined) {
        warnLog(
          'conditional stats',
          'stat condition depends on class type but we do not have a class type here'
        );
        return true;
      }
      return classType === rule.classType;
    case 'adeptWeapon':
      return item ? adeptWeaponHashes.includes(item.hash) : warnMissingItem();
    case 'masterwork':
      return item?.masterwork ?? warnMissingItem();
    case 'enhancedIntrinsic':
      // Crafted weapons get bonus stats from enhanced intrinsics at Level 20+.
      // The number 20 isn't in the definitions, so just hardcoding it here.
      // Alternatively, enhancing an adept weapon gives it an enhanced intrinsic
      // that gives bonus stats simply because it's an adept weapon, and more if Level 20+.
      // stats.ts:getPlugStatValue actually takes care of scaling this to the correct bonus.
      return item
        ? (item.craftedInfo?.level || 0) >= 20 || adeptWeaponHashes.includes(item.hash)
        : warnMissingItem();
  }
}

/**
 * Turn the investmentStats from `itemDef` into an elaborated form
 * that more explicitly contains the plug stat activity rules and
 * fixes some data errors/problems.
 *
 * TODO: If/when https://github.com/DestinyItemManager/DIM/issues/9076
 * happens and we use DimPlug everywhere, we store the return value in
 * DimPlug instead of caching here.
 */
export const mapAndFilterInvestmentStats = weakMemoize(
  (itemDef: PluggableInventoryItemDefinition): readonly Readonly<DimPlugInvestmentStat>[] => {
    let hasDupes: boolean | undefined;

    // Fast path in case all stats are active and we need no postprocessing.
    // This needs some knowledge of how `getPlugInvestmentStatActivityRule` works...
    if (
      !itemDef.traitHashes?.includes(EXOTIC_CATALYST_TRAIT) &&
      itemDef.investmentStats.every((s) => !s.isConditionallyActive)
    ) {
      hasDupes =
        uniqBy(itemDef.investmentStats, (s) => s.statTypeHash).length !==
        itemDef.investmentStats.length;
      if (!hasDupes) {
        return itemDef.investmentStats;
      }
    }

    const stats = filterMap(itemDef.investmentStats, (stat, index) => {
      if (itemDef.hash === 2282937672 /* InventoryItem "Bipod" */) {
        if (itemDef.investmentStats.length === 4) {
          // Enhanced Bipod has [-25 blast radius, -15 reload speed, -30 blast radius, -20 reload speed]
          // investment stats, all conditionally active. Only the lower stats should apply, the others
          // are from the base perk and included in the defs for whatever reason.
          if (index >= 2) {
            return undefined;
          }
        } else {
          warnLog('plug stats', 'enhanced bipod workaround does not apply anymore');
        }
      }
      const activityRule = getPlugInvestmentStatActivityRule(itemDef, stat);
      if (activityRule?.rule === 'never') {
        return undefined;
      }
      return { activityRule, statTypeHash: stat.statTypeHash, value: stat.value };
    });

    // If there are duplicate stats, consolidate them.
    // This is not particularly efficient, but this should be extraordinarily rare.
    if (hasDupes) {
      for (let idx = stats.length - 2; idx >= 0; idx--) {
        for (let idx2 = stats.length - 1; idx2 > idx; idx2--) {
          if (stats[idx].statTypeHash === stats[idx2].statTypeHash) {
            if (stats[idx].activityRule?.rule === stats[idx2].activityRule?.rule) {
              stats[idx].value += stats[idx2].value;
              stats.splice(idx2, 1);
              infoLog('plug stats', 'consolidating stat index', idx2, 'into', idx, itemDef);
            } else {
              warnLog(
                'plug stats',
                'item has duplicated stats with different activity rule, subsequent code will not handle this correctly',
                itemDef
              );
            }
          }
        }
      }
    }

    return stats;
  }
);
