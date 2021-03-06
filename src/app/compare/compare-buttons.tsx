import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import ElementIcon from 'app/dim-ui/ElementIcon';
import { getWeaponArchetype } from 'app/dim-ui/WeaponArchetype';
import { t } from 'app/i18next-t';
import { DimItem } from 'app/inventory/item-types';
import { makeDupeID } from 'app/search/search-filters/dupes';
import {
  getItemDamageShortName,
  getItemSpecialtyModSlotDisplayNames,
  getSpecialtySocketMetadatas,
} from 'app/utils/item-utils';
import { DamageType } from 'bungie-api-ts/destiny2';
import { BucketHashes, ItemCategoryHashes, StatHashes } from 'data/d2/generated-enums';
import _ from 'lodash';
import React from 'react';

/** A definition for a button on the top of the compare too, which can be clicked to show the given items. */
export interface CompareButton {
  buttonLabel: React.ReactNode;
  // TODO: remove
  items: DimItem[];
  /** The query that results in this list of items */
  query: string;
}

/**
 * Generate possible comparisons for armor, given a reference item.
 */
export function findSimilarArmors(
  defs: D2ManifestDefinitions | undefined,
  allItems: DimItem[],
  exampleItem: DimItem
): CompareButton[] {
  const exampleItemElementIcon = <ElementIcon key={exampleItem.id} element={exampleItem.element} />;
  const exampleItemModSlotMetadatas = getSpecialtySocketMetadatas(exampleItem);
  const specialtyModSlotNames = defs && getItemSpecialtyModSlotDisplayNames(exampleItem, defs);

  // helper functions for filtering items
  const matchesExample = (key: keyof DimItem) => (item: DimItem) => item[key] === exampleItem[key];
  const matchingModSlot = (item: DimItem) => {
    const m = getSpecialtySocketMetadatas(item);
    return (
      exampleItemModSlotMetadatas?.length === m?.length &&
      m?.every((n) => exampleItemModSlotMetadatas?.includes(n))
    );
  };
  const hasEnergy = (item: DimItem) => Boolean(item.energy);

  // minimum filter: make sure it's all armor, and can go in the same slot on the same class
  const allArmors = allItems
    .filter((i) => i.bucket.inArmor)
    .filter(matchesExample('typeName'))
    .filter(matchesExample('classType'));

  // TODO: omit some of these for D1?
  let comparisonSets: CompareButton[] = _.compact([
    // same slot on the same class
    {
      buttonLabel: exampleItem.typeName,
      items: allArmors,
      query: '', // since we already filter by itemCategoryHash, an empty query gives you all items matching that category
    },

    // above but also has to be armor 2.0
    {
      buttonLabel: [t('Compare.Armor2'), exampleItem.typeName].join(' + '),
      items: hasEnergy(exampleItem) ? allArmors.filter(hasEnergy) : [],
      query: 'is:armor2.0',
    },

    // above but also the same seasonal mod slot, if it has one
    exampleItem.element &&
      exampleItemModSlotMetadatas && {
        buttonLabel: specialtyModSlotNames?.join(' + '),
        items: allArmors.filter(hasEnergy).filter(matchingModSlot),
        query: `is:armor2.0 ${exampleItemModSlotMetadatas
          .map((m) => `modslot:${m.slotTag || 'none'}`)
          .join(' ')}`,
      },

    // armor 2.0 and needs to match energy capacity element
    exampleItem.element && {
      buttonLabel: [exampleItemElementIcon, exampleItem.typeName],
      items: allArmors.filter(hasEnergy).filter(matchesExample('element')),
      query: `is:armor2.0 is:${getItemDamageShortName(exampleItem)}`,
    },

    // above but also the same seasonal mod slot, if it has one
    exampleItem.element &&
      exampleItemModSlotMetadatas && {
        buttonLabel: [exampleItemElementIcon, specialtyModSlotNames?.join(' + ')],
        items:
          hasEnergy(exampleItem) && exampleItemModSlotMetadatas
            ? allArmors.filter(hasEnergy).filter(matchingModSlot).filter(matchesExample('element'))
            : [],
        query: `is:armor2.0 is:${getItemDamageShortName(
          exampleItem
        )} ${exampleItemModSlotMetadatas.map((m) => `modslot:${m.slotTag || 'none'}`).join(' ')}`,
      },

    // basically stuff with the same name & categories
    {
      buttonLabel: exampleItem.name,
      items: allArmors.filter((i) => makeDupeID(i) === makeDupeID(exampleItem)),
      // TODO: I'm gonna get in trouble for this but I think it should just match on name which includes reissues
      query: `name:"${exampleItem.name}"`,
    },

    // above, but also needs to match energy capacity element
    exampleItem.element && {
      buttonLabel: [exampleItemElementIcon, exampleItem.name],
      items: hasEnergy(exampleItem)
        ? allArmors
            .filter(hasEnergy)
            .filter(matchesExample('element'))
            .filter((i) => makeDupeID(i) === makeDupeID(exampleItem))
        : [],
      query: `name:"${exampleItem.name}" is:${getItemDamageShortName(exampleItem)}`,
    },
  ]);

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

  const bucketToSearch = {
    [BucketHashes.KineticWeapons]: `is:kinetic`,
    [BucketHashes.EnergyWeapons]: `is:energy`,
    [BucketHashes.PowerWeapons]: `is:heavy`,
  };

  let comparisonSets: CompareButton[] = _.compact([
    // same weapon type
    {
      // TODO: replace typeName with a lookup of itemCategoryHash
      buttonLabel: exampleItem.typeName,
      items: allWeapons,
      query: '', // since we already filter by itemCategoryHash, an empty query gives you all items matching that category
    },

    // above, but also same (kinetic/energy/heavy) slot
    {
      buttonLabel: [exampleItem.bucket.name, exampleItem.typeName].join(' + '),
      items: allWeapons.filter((i) => i.bucket.name === exampleItem.bucket.name),
      query: bucketToSearch[exampleItem.bucket.hash],
    },

    // same weapon type plus matching intrinsic (rpm+impact..... ish)
    {
      buttonLabel: [intrinsicName, exampleItem.typeName].join(' + '),
      items:
        exampleItem.destinyVersion === 2
          ? allWeapons.filter((i) => getWeaponArchetype(i)?.hash === intrinsicHash)
          : allWeapons.filter((i) => exampleItemRpm === getRpm(i)),
      query:
        exampleItem.destinyVersion === 2 && intrinsic
          ? // TODO: add a search by perk hash? It'd be slightly different
            `perkname:"${intrinsic.displayProperties.name}"`
          : `stat:rpm:${exampleItemRpm}`,
    },

    // same weapon type and also matching element (& usually same-slot because same element)
    exampleItem.element &&
      // Don't bother with this for kinetic, since we also have "kinetic slot" as an option
      exampleItem.element.enumValue !== DamageType.Kinetic && {
        buttonLabel: [exampleItemElementIcon, exampleItem.typeName],
        items: allWeapons.filter(matchesExample('element')),
        query: `is:${getItemDamageShortName(exampleItem)}`,
      },

    // exact same weapon, judging by name. might span multiple expansions.
    {
      buttonLabel: exampleItem.name,
      items: allWeapons.filter(matchesExample('name')),
      query: `name:"${exampleItem.name}"`,
    },
  ]);

  // TODO: apply the search to find the items instead!
  // TODO: move this button filtering logic into a display component?

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
