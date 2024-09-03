import { maxLightItemSet } from 'app/loadout-drawer/auto-loadouts';
import { getLight } from 'app/loadout-drawer/loadout-utils';
import { powerLevelByKeyword } from 'app/search/power-levels';
import { RootState } from 'app/store/types';
import { createSelector } from 'reselect';
import { DimItem } from '../item-types';
import { allItemsSelector, storesSelector } from '../selectors';
import { getArtifactBonus } from '../stores-helpers';

/**
 * Does this store (character) have any classified items that might affect their power level?
 * Things to consider:
 * - Classified items don't always lack a power level.
 * - If a char has an equippable item at pinnacle cap in a particular slot,
 *   who cares if there's a classified item in that slot? Not like it's higher.
 *
 * This relies on a precalculated set generated from allItems, using getBucketsWithClassifiedItems.
 */
function hasAffectingClassified(
  unrestrictedMaxLightGear: DimItem[],
  bucketsWithClassifieds: Set<number>,
) {
  return unrestrictedMaxLightGear.some(
    (i) =>
      // isn't pinnacle cap
      i.power !== powerLevelByKeyword.pinnaclecap &&
      // and shares a bucket with a classified item (which might be higher power)
      bucketsWithClassifieds.has(i.bucket.hash),
  );
}

/** figures out which buckets contain classified items */
function getBucketsWithClassifiedItems(allItems: DimItem[]) {
  const bucketsWithClassifieds = new Set<number>();
  for (const i of allItems) {
    if (i.classified && !i.power && (i.location.inWeapons || i.location.inArmor)) {
      bucketsWithClassifieds.add(i.bucket.hash);
    }
  }
  return bucketsWithClassifieds;
}

export interface StorePowerLevel {
  /** average of your highest gear, even if not equippable at the same time */
  maxGearPower: number;
  /** average of your highest simultaneously equippable gear */
  maxEquippableGearPower: number;
  /** average of your highest gear in each bucket, even if it's not equippable by this store. destiny's new power algorithm as of The Final Shape */
  dropPower: number;
  /** currently represents the power level bonus provided by the Seasonal Artifact */
  powerModifier: number;
  /** maxGearPower + powerModifier. the highest PL you can get your inventory screen to show */
  maxTotalPower: number;

  /** the highest-power items per bucket, even if not equippable at the same time */
  highestPowerItems: DimItem[];
  /** the highest-power simultaneously equippable gear */
  maxEquippablePowerItems: DimItem[];

  /** the highest-power items per bucket, even if it's not equippable by this store. destiny's new power algorithm as of The Final Shape */
  dropCalcItems: DimItem[];

  /** maxGearPower and maxTotalPower can come with various caveats */
  problems: {
    /** this stat may be inaccurate because it relies on classified items */
    hasClassified: boolean;
    /** mutually excluded exotics are included in the max possible power */
    notEquippable: boolean;
    /** this character is in danger of dropping at a worse Power Level! another character is holding their best item(s) */
    notOnStore: boolean;
  };
}

export const allPowerLevelsSelector = createSelector(
  storesSelector,
  allItemsSelector,
  (stores, allItems) => {
    const bucketsWithClassifieds = getBucketsWithClassifiedItems(allItems);

    const levels: {
      [storeId: string]: StorePowerLevel;
    } = {};

    for (const store of stores) {
      if (store.isVault) {
        continue;
      }

      const { equippable, equipUnrestricted, classUnrestricted } = maxLightItemSet(allItems, store);

      const dropPowerLevel = getLight(store, classUnrestricted);

      const unrestrictedMaxGearPower = getLight(store, equipUnrestricted);
      const equippableMaxGearPower = getLight(store, equippable);
      const dropPower = getLight(store, classUnrestricted);

      const notEquippable = unrestrictedMaxGearPower !== equippableMaxGearPower;
      const notOnStore = dropPowerLevel !== unrestrictedMaxGearPower;
      const hasClassified = hasAffectingClassified(equipUnrestricted, bucketsWithClassifieds);
      const artifactPower = getArtifactBonus(store);

      levels[store.id] = {
        maxGearPower: unrestrictedMaxGearPower,
        maxEquippableGearPower: equippableMaxGearPower,
        maxEquippablePowerItems: equippable,
        dropPower,
        powerModifier: artifactPower,
        maxTotalPower: unrestrictedMaxGearPower + artifactPower,
        highestPowerItems: equipUnrestricted,
        dropCalcItems: classUnrestricted,
        problems: {
          hasClassified,
          notEquippable,
          notOnStore,
        },
      };
    }

    return levels;
  },
);

export const powerLevelSelector = (state: RootState, storeId: string | undefined) =>
  storeId !== undefined ? allPowerLevelsSelector(state)[storeId] : undefined;

export const dropPowerLevelSelector = (storeId: string | undefined) => (state: RootState) =>
  powerLevelSelector(state, storeId)?.dropPower;
