import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import ElementIcon from 'app/dim-ui/ElementIcon';
import { getWeaponArchetype } from 'app/dim-ui/WeaponArchetype';
import { t } from 'app/i18next-t';
import { DimItem } from 'app/inventory/item-types';
import { makeDupeID } from 'app/search/search-filters/dupes';
import {
  getItemSpecialtyModSlotDisplayName,
  getSpecialtySocketMetadata,
} from 'app/utils/item-utils';
import { ItemCategoryHashes, StatHashes } from 'data/d2/generated-enums';
import React from 'react';

/** A definition for a button on the top of the compare too, which can be clicked to show the given items. */
export interface CompareButton {
  buttonLabel: React.ReactNode;
  items: DimItem[];
}

/**
 * Generate possible comparisons for armor, given a reference item.
 */
export function findSimilarArmors(
  defs: D2ManifestDefinitions,
  allItems: DimItem[],
  exampleItem: DimItem
): CompareButton[] {
  const exampleItemElementIcon = <ElementIcon key={exampleItem.id} element={exampleItem.element} />;
  const exampleItemModSlot = getSpecialtySocketMetadata(exampleItem);
  const specialtyModSlotName =
    (defs && getItemSpecialtyModSlotDisplayName(exampleItem, defs)) ?? '';

  // helper functions for filtering items
  const matchesExample = (key: keyof DimItem) => (item: DimItem) => item[key] === exampleItem[key];
  const matchingModSlot = (item: DimItem) =>
    exampleItemModSlot === getSpecialtySocketMetadata(item);
  const hasEnergy = (item: DimItem) => Boolean(item.energy);

  // minimum filter: make sure it's all armor, and can go in the same slot on the same class
  const allArmors = allItems
    .filter((i) => i.bucket.inArmor)
    .filter(matchesExample('typeName'))
    .filter(matchesExample('classType'));

  let comparisonSets = [
    // same slot on the same class
    {
      buttonLabel: exampleItem.typeName,
      items: allArmors,
    },

    // above but also has to be armor 2.0
    {
      buttonLabel: [t('Compare.Armor2'), exampleItem.typeName].join(' + '),
      items: hasEnergy(exampleItem) ? allArmors.filter(hasEnergy) : [],
    },

    // above but also the same seasonal mod slot, if it has one
    {
      buttonLabel: [specialtyModSlotName].join(' + '),
      items:
        hasEnergy(exampleItem) && exampleItemModSlot
          ? allArmors.filter(hasEnergy).filter(matchingModSlot)
          : [],
    },

    // armor 2.0 and needs to match energy capacity element
    {
      buttonLabel: [exampleItemElementIcon, exampleItem.typeName],
      items: hasEnergy(exampleItem)
        ? allArmors.filter(hasEnergy).filter(matchesExample('element'))
        : [],
    },
    // above but also the same seasonal mod slot, if it has one
    {
      buttonLabel: [exampleItemElementIcon, specialtyModSlotName],
      items:
        hasEnergy(exampleItem) && exampleItemModSlot
          ? allArmors.filter(hasEnergy).filter(matchingModSlot).filter(matchesExample('element'))
          : [],
    },

    // basically stuff with the same name & categories
    {
      buttonLabel: exampleItem.name,
      items: allArmors.filter((i) => makeDupeID(i) === makeDupeID(exampleItem)),
    },

    // above, but also needs to match energy capacity element
    {
      buttonLabel: [exampleItemElementIcon, exampleItem.name],
      items: hasEnergy(exampleItem)
        ? allArmors
            .filter(hasEnergy)
            .filter(matchesExample('element'))
            .filter((i) => makeDupeID(i) === makeDupeID(exampleItem))
        : [],
    },
  ];

  // here, we dump some buttons if they aren't worth displaying

  comparisonSets = comparisonSets.reverse();
  comparisonSets = comparisonSets.filter((comparisonSet, index) => {
    const nextComparisonSet = comparisonSets[index + 1];
    // always print the final button
    if (!nextComparisonSet) {
      return true;
    }
    // skip empty buttons
    if (!comparisonSet.items.length) {
      return false;
    }
    // skip if the next button has [all of, & only] the exact same items in it
    if (
      comparisonSet.items.length === nextComparisonSet.items.length &&
      comparisonSet.items.every((setItem) =>
        nextComparisonSet.items.some((nextSetItem) => nextSetItem === setItem)
      )
    ) {
      return false;
    }
    return true;
  });

  return comparisonSets;
}

/**
 * Generate possible comparisons for weapons, given a reference item.
 */
export function findSimilarWeapons(allItems: DimItem[], exampleItem: DimItem): CompareButton[] {
  const exampleItemElementIcon = <ElementIcon key={exampleItem.id} element={exampleItem.element} />;

  const matchesExample = (key: keyof DimItem) => (item: DimItem) => item[key] === exampleItem[key];
  // stuff for looking up weapon archetypes
  const getRpm = (i: DimItem) => {
    const itemRpmStat = i.stats?.find(
      (s) =>
        s.statHash ===
        (exampleItem.destinyVersion === 1
          ? exampleItem.stats![0].statHash
          : StatHashes.RoundsPerMinute)
    );
    return itemRpmStat?.value || -99999999;
  };

  const exampleItemRpm = getRpm(exampleItem);
  const intrinsic = getWeaponArchetype(exampleItem);
  const intrinsicName = intrinsic?.displayProperties.name || t('Compare.Archetype');
  const intrinsicHash = intrinsic?.hash;

  // minimum filter: make sure it's all weapons and the same weapon type
  const allWeapons = allItems
    .filter((i) => i.bucket.inWeapons)
    .filter(matchesExample('typeName'))
    .filter(
      (i) =>
        // specifically for destiny 2 grenade launchers, let's not compare special with heavy.
        // all other weapon types with multiple ammos, are novelty exotic exceptions
        !(exampleItem.destinyVersion === 2) ||
        !(i.destinyVersion === 2) ||
        !exampleItem.itemCategoryHashes.includes(ItemCategoryHashes.GrenadeLaunchers) ||
        exampleItem.ammoType === i.ammoType
    );

  let comparisonSets = [
    // same weapon type
    {
      buttonLabel: exampleItem.typeName,
      items: allWeapons,
    },

    // above, but also same (kinetic/energy/heavy) slot
    {
      buttonLabel: [exampleItem.bucket.name, exampleItem.typeName].join(' + '),
      items: allWeapons.filter((i) => i.bucket.name === exampleItem.bucket.name),
    },

    // same weapon type plus matching intrinsic (rpm+impact..... ish)
    {
      buttonLabel: [intrinsicName, exampleItem.typeName].join(' + '),
      items:
        exampleItem.destinyVersion === 2
          ? allWeapons.filter((i) => getWeaponArchetype(i)?.hash === intrinsicHash)
          : allWeapons.filter((i) => exampleItemRpm === getRpm(i)),
    },

    // same weapon type and also matching element (& usually same-slot because same element)
    {
      buttonLabel: [exampleItemElementIcon, exampleItem.typeName],
      items: allWeapons.filter(matchesExample('element')),
    },

    // exact same weapon, judging by name. might span multiple expansions.
    {
      buttonLabel: exampleItem.name,
      items: allWeapons.filter(matchesExample('name')),
    },
  ];
  comparisonSets = comparisonSets.reverse();
  comparisonSets = comparisonSets.filter((comparisonSet, index) => {
    const nextComparisonSet = comparisonSets[index + 1];
    // always print the final button
    if (!nextComparisonSet) {
      return true;
    }
    // skip empty buttons
    if (!comparisonSet.items.length) {
      return false;
    }
    // skip if the next button has [all of, & only] the exact same items in it
    if (
      comparisonSet.items.length === nextComparisonSet.items.length &&
      comparisonSet.items.every((setItem) =>
        nextComparisonSet.items.some((nextSetItem) => nextSetItem === setItem)
      )
    ) {
      return false;
    }
    return true;
  });

  return comparisonSets;
}
