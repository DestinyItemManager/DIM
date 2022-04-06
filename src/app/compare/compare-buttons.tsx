import BungieImage from 'app/dim-ui/BungieImage';
import ElementIcon from 'app/dim-ui/ElementIcon';
import { ArmorSlotIcon, WeaponSlotIcon, WeaponTypeIcon } from 'app/dim-ui/ItemCategoryIcon';
import { SpecialtyModSlotIcon } from 'app/dim-ui/SpecialtyModSlotIcon';
import { t } from 'app/i18next-t';
import { DimItem } from 'app/inventory/item-types';
import { quoteFilterString } from 'app/search/query-parser';
import { getInterestingSocketMetadatas, getItemDamageShortName } from 'app/utils/item-utils';
import { getWeaponArchetype } from 'app/utils/socket-utils';
import rarityIcons from 'data/d2/engram-rarity-icons.json';
import { BucketHashes, StatHashes } from 'data/d2/generated-enums';
import _ from 'lodash';
import React from 'react';
import styles from './CompareButtons.m.scss';

/** A definition for a button on the top of the compare too, which can be clicked to show the given items. */
interface CompareButton {
  buttonLabel: React.ReactNode[];
  /** The query that results in this list of items */
  query: string;
}

/**
 * Generate possible comparisons for armor, given a reference item.
 */
export function findSimilarArmors(exampleItem: DimItem): CompareButton[] {
  const exampleItemElementIcon = <ElementIcon key={exampleItem.id} element={exampleItem.element} />;
  const exampleItemModSlotMetadatas = getInterestingSocketMetadatas(exampleItem);

  let comparisonSets: CompareButton[] = _.compact([
    // same slot on the same class
    {
      buttonLabel: [
        <ArmorSlotIcon key="slot" item={exampleItem} className={styles.svgIcon} />,
        '+ ' + t('Stats.Sunset'),
      ],
      query: '', // since we already filter by itemCategoryHash, an empty query gives you all items matching that category
    },

    // above but also has to be armor 2.0
    exampleItem.destinyVersion === 2 && {
      buttonLabel: [<ArmorSlotIcon key="slot" item={exampleItem} className={styles.svgIcon} />],
      query: 'not:sunset',
    },

    // above but also has to be legendary
    exampleItem.destinyVersion === 2 &&
      exampleItem.tier === 'Legendary' && {
        buttonLabel: [
          <BungieImage key="rarity" src={rarityIcons.Legendary} />,
          <ArmorSlotIcon key="slot" item={exampleItem} className={styles.svgIcon} />,
        ],
        query: 'not:sunset is:legendary',
      },

    // above but also the same seasonal mod slot, if it has one
    exampleItem.destinyVersion === 2 &&
      exampleItem.element &&
      exampleItemModSlotMetadatas && {
        buttonLabel: [
          <SpecialtyModSlotIcon
            excludeStandardD2ModSockets
            className={styles.inlineModSlotIcon}
            key="1"
            lowRes
            item={exampleItem}
          />,
          <ArmorSlotIcon key="slot" item={exampleItem} className={styles.svgIcon} />,
        ],
        query: `not:sunset ${exampleItemModSlotMetadatas
          .map((m) => `modslot:${m.slotTag || 'none'}`)
          .join(' ')}`,
      },

    // armor 2.0 and needs to match energy capacity element
    exampleItem.destinyVersion === 2 &&
      exampleItem.element && {
        buttonLabel: [
          exampleItemElementIcon,
          <ArmorSlotIcon key="slot" item={exampleItem} className={styles.svgIcon} />,
        ],
        query: `not:sunset is:${getItemDamageShortName(exampleItem)}`,
      },

    // above but also the same seasonal mod slot, if it has one
    exampleItem.destinyVersion === 2 &&
      exampleItem.element &&
      exampleItemModSlotMetadatas && {
        buttonLabel: [
          exampleItemElementIcon,
          <SpecialtyModSlotIcon
            excludeStandardD2ModSockets
            className={styles.inlineModSlotIcon}
            key="1"
            lowRes
            item={exampleItem}
          />,
          <ArmorSlotIcon key="slot" item={exampleItem} className={styles.svgIcon} />,
        ],
        query: `not:sunset is:${getItemDamageShortName(exampleItem)} ${exampleItemModSlotMetadatas
          .map((m) => `modslot:${m.slotTag || 'none'}`)
          .join(' ')}`,
      },

    // basically stuff with the same name & categories
    {
      buttonLabel: [exampleItem.name],
      // TODO: I'm gonna get in trouble for this but I think it should just match on name which includes reissues. The old logic used dupeID which is more discriminating.
      query: `name:"${exampleItem.name}"`,
    },
  ]);

  comparisonSets = comparisonSets.reverse();
  return comparisonSets;
}

const bucketToSearch = {
  [BucketHashes.KineticWeapons]: `is:kineticslot`,
  [BucketHashes.EnergyWeapons]: `is:energy`,
  [BucketHashes.PowerWeapons]: `is:heavy`,
};

// stuff for looking up weapon archetypes
const getRpm = (i: DimItem) => {
  const itemRpmStat = i.stats?.find(
    (s) =>
      s.statHash === (i.destinyVersion === 1 ? i.stats![0].statHash : StatHashes.RoundsPerMinute)
  );
  return itemRpmStat?.value || -99999999;
};

/**
 * Strips the (Timelost) or (Adept) suffixes for the user's language
 * in order to include adept items in non-adept comparisons and vice versa.
 */
export const stripAdept = (name: string) =>
  name
    .replace(new RegExp(t('Filter.Adept'), 'gi'), '')
    .trim()
    .replace(new RegExp(t('Filter.Timelost'), 'gi'), '')
    .trim();

/**
 * Generate possible comparisons for weapons, given a reference item.
 */
export function findSimilarWeapons(exampleItem: DimItem): CompareButton[] {
  const intrinsic = getWeaponArchetype(exampleItem);
  const intrinsicName = intrinsic?.displayProperties.name || t('Compare.Archetype');
  const adeptStripped = stripAdept(exampleItem.name);

  let comparisonSets: CompareButton[] = _.compact([
    // same weapon type
    {
      // TODO: replace typeName with a lookup of itemCategoryHash
      buttonLabel: [<WeaponTypeIcon key="type" item={exampleItem} className={styles.svgIcon} />],
      query: '', // since we already filter by itemCategoryHash, an empty query gives you all items matching that category
    },

    // above but also has to be legendary
    exampleItem.destinyVersion === 2 &&
      exampleItem.tier === 'Legendary' && {
        buttonLabel: [
          <BungieImage key="rarity" src={rarityIcons.Legendary} />,
          <WeaponTypeIcon key="type" item={exampleItem} className={styles.svgIcon} />,
        ],
        query: 'is:legendary',
      },

    // above, but also matching intrinsic (rpm+impact..... ish)
    {
      buttonLabel: [
        intrinsicName,
        <WeaponSlotIcon key="slot" item={exampleItem} className={styles.svgIcon} />,
        <WeaponTypeIcon key="type" item={exampleItem} className={styles.svgIcon} />,
      ],
      query:
        '(' +
        bucketToSearch[exampleItem.bucket.hash] +
        ' ' +
        (exampleItem.destinyVersion === 2 && intrinsic
          ? // TODO: add a search by perk hash? It'd be slightly different than searching by name
            `perkname:${quoteFilterString(intrinsic.displayProperties.name)}`
          : `stat:rpm:${getRpm(exampleItem)}`) +
        ')',
    },

    // above, but also same (kinetic/energy/heavy) slot
    {
      buttonLabel: [
        <WeaponSlotIcon key="slot" item={exampleItem} className={styles.svgIcon} />,
        <WeaponTypeIcon key="type" item={exampleItem} className={styles.svgIcon} />,
      ],
      query: bucketToSearch[exampleItem.bucket.hash],
    },

    // same weapon type and also matching element (& usually same-slot because same element)
    exampleItem.element && {
      buttonLabel: [
        <ElementIcon key={exampleItem.id} element={exampleItem.element} />,
        <WeaponTypeIcon key="type" item={exampleItem} className={styles.svgIcon} />,
      ],
      query: `is:${getItemDamageShortName(exampleItem)}`,
    },

    // exact same weapon, judging by name. might span multiple expansions.
    {
      buttonLabel: [adeptStripped],
      query: `name:"${adeptStripped}"`,
    },
  ]);

  comparisonSets = comparisonSets.reverse();
  return comparisonSets;
}
/**
 * Generate possible comparisons for non-armor/weapon, given a reference item
 */
export function defaultComparisons(exampleItem: DimItem): CompareButton[] {
  let comparisonSets: CompareButton[] = _.compact([
    // same item type
    {
      // TODO: replace typeName with a lookup of itemCategoryHash
      buttonLabel: [exampleItem.typeName],
      query: '', // since we already filter by itemCategoryHash, an empty query gives you all items matching that category
    },

    // exact same item, judging by name. might span multiple expansions.
    {
      buttonLabel: [exampleItem.name],
      query: `name:"${exampleItem.name}"`,
    },
  ]);

  comparisonSets = comparisonSets.reverse();
  return comparisonSets;
}
