import BungieImage from 'app/dim-ui/BungieImage';
import ElementIcon from 'app/dim-ui/ElementIcon';
import { ArmorSlotIcon, WeaponSlotIcon, WeaponTypeIcon } from 'app/dim-ui/ItemCategoryIcon';
import { PressTip } from 'app/dim-ui/PressTip';
import { SpecialtyModSlotIcon } from 'app/dim-ui/SpecialtyModSlotIcon';
import { t } from 'app/i18next-t';
import { DimItem } from 'app/inventory/item-types';
import { realD2ArmorStatSearchByHash } from 'app/search/d2-known-values';
import { quoteFilterString } from 'app/search/query-parser';
import { compact, filterMap } from 'app/utils/collections';
import {
  getArmor3StatFocus,
  getInterestingSocketMetadatas,
  getItemDamageShortName,
  isEdgeOfFateArmorMasterwork,
} from 'app/utils/item-utils';
import {
  getArmorArchetype,
  getExtraIntrinsicPerkSockets,
  getIntrinsicArmorPerkSocket,
  getWeaponArchetype,
} from 'app/utils/socket-utils';
import clsx from 'clsx';
import rarityIcons from 'data/d2/engram-rarity-icons.json';
import { BucketHashes, StatHashes } from 'data/d2/generated-enums';
import archetypeIcon from 'images/armorArchetype.png';
import React from 'react';
import styles from './CompareButtons.m.scss';
import { compareNameQuery, stripAdept } from './compare-utils';

/** A definition for a button on the top of the compare too, which can be clicked to show the given items. */
interface CompareButton {
  buttonLabel: React.ReactNode[];
  /** The query that results in this list of items */
  query: string;
}
const modernArmor = 'is:armor2.0 or is:armor3.0';

/**
 * Generate possible comparisons for armor, given a reference item.
 */
export function findSimilarArmors(exampleItem: DimItem): CompareButton[] {
  const exampleItemModSlotMetadatas = getInterestingSocketMetadatas(exampleItem);
  const exampleItemIntrinsic =
    !exampleItem.isExotic &&
    getIntrinsicArmorPerkSocket(exampleItem)?.plugged?.plugDef.displayProperties;

  const archetype = getArmorArchetype(exampleItem);
  const tertiaryStatHash =
    isEdgeOfFateArmorMasterwork(exampleItem) && getArmor3StatFocus(exampleItem)?.[2];
  const tertiaryStat = tertiaryStatHash && realD2ArmorStatSearchByHash[tertiaryStatHash];
  const tertiaryStatDisplay =
    tertiaryStatHash &&
    exampleItem.stats!.find((s) => s.statHash === tertiaryStatHash)!.displayProperties;

  // exotic class item perks
  const extraIntrinsicButtons =
    (exampleItem.destinyVersion === 2 &&
      filterMap(
        getExtraIntrinsicPerkSockets(exampleItem),
        (s) => s.plugged?.plugDef.displayProperties,
      )
        ?.map((intrinsic) => ({
          buttonLabel: [
            <BungieImage
              key="1"
              className={clsx(styles.intrinsicIcon, 'dontInvert')}
              src={intrinsic.icon}
            />,
            intrinsic.name,
            exampleItem.rarity === 'Legendary' ? (
              // eslint-disable-next-line @eslint-react/no-duplicate-key
              <BungieImage key="rarity" src={rarityIcons.Legendary} className="dontInvert" />
            ) : null,
            <ArmorSlotIcon key="slot" item={exampleItem} className={styles.svgIcon} />,
          ],
          query: `${archetype ? 'is:armor3.0' : modernArmor} perk:${quoteFilterString(intrinsic.name)} is:${exampleItem.rarity}`,
        }))
        .reverse()) ||
    [];

  return compact([
    // same slot on the same class
    {
      buttonLabel: [
        <ArmorSlotIcon key="slot" item={exampleItem} className={styles.svgIcon} />,
        `+ ${t('Compare.NoModArmor')}`,
      ],
      query: '', // since we already filter by itemCategoryHash, an empty query gives you all items matching that category
    },

    // above but also has to be modern armor (2.0 or 3.0)
    exampleItem.destinyVersion === 2 && {
      buttonLabel: [<ArmorSlotIcon key="slot" item={exampleItem} className={styles.svgIcon} />],
      query: modernArmor,
    },

    // above but also has to be legendary
    exampleItem.destinyVersion === 2 &&
      exampleItem.rarity === 'Legendary' && {
        buttonLabel: [
          <BungieImage key="rarity" src={rarityIcons.Legendary} className="dontInvert" />,
          <ArmorSlotIcon key="slot" item={exampleItem} className={styles.svgIcon} />,
        ],
        query: `${modernArmor} is:legendary`,
      },

    // above but also the same seasonal mod slot, if it has one
    exampleItem.destinyVersion === 2 &&
      exampleItemModSlotMetadatas && {
        buttonLabel: [
          <SpecialtyModSlotIcon
            excludeStandardD2ModSockets
            className={styles.inlineImageIcon}
            key="1"
            lowRes
            item={exampleItem}
          />,
          <BungieImage key="rarity" src={rarityIcons.Legendary} className="dontInvert" />,
          <ArmorSlotIcon key="slot" item={exampleItem} className={styles.svgIcon} />,
        ],
        query: `${modernArmor} ${exampleItemModSlotMetadatas
          .map((m) => `modslot:${m.slotTag || 'none'}`)
          .join(' ')}`,
      },

    // above but also the same special intrinsic, if it has one
    exampleItem.destinyVersion === 2 &&
      exampleItemIntrinsic && {
        buttonLabel: [
          <PressTip minimal tooltip={exampleItemIntrinsic.name} key="1">
            <BungieImage
              className={clsx(styles.intrinsicIcon, 'dontInvert')}
              src={exampleItemIntrinsic.icon}
            />
          </PressTip>,
          <BungieImage key="rarity" src={rarityIcons.Legendary} className="dontInvert" />,
          <ArmorSlotIcon key="slot" item={exampleItem} className={styles.svgIcon} />,
        ],
        query: `${modernArmor} perk:${quoteFilterString(exampleItemIntrinsic.name)} is:${exampleItem.rarity}`,
      },

    // above but only Armor 3.0 if the example item is Armor 3.0
    exampleItem.destinyVersion === 2 &&
      exampleItem.rarity === 'Legendary' &&
      archetype && {
        buttonLabel: [
          <img key="1" className={clsx(styles.intrinsicIcon, 'dontInvert')} src={archetypeIcon} />,
          <span key="2">{t('Compare.Archetype')}</span>,
          <BungieImage key="rarity" src={rarityIcons.Legendary} className="dontInvert" />,
          <ArmorSlotIcon key="slot" item={exampleItem} className={styles.svgIcon} />,
        ],
        query: `is:armor3.0 is:legendary`,
      },

    // Try to make a group of armors 3.0 with the exact same 3 stats focused. This is an easy win for identifying better/worse armor.
    exampleItem.destinyVersion === 2 &&
      archetype && {
        buttonLabel: [
          <BungieImage
            key="1"
            className={clsx(styles.intrinsicIcon, 'dontInvert')}
            src={archetype.displayProperties.icon}
          />,
          <span key="2">{archetype.displayProperties.name}</span>,
          <BungieImage key="rarity" src={rarityIcons.Legendary} className="dontInvert" />,
          <ArmorSlotIcon key="slot" item={exampleItem} className={styles.svgIcon} />,
        ],
        query: `${modernArmor} perk:${quoteFilterString(archetype.displayProperties.name)} tertiarystat:${tertiaryStat} is:${exampleItem.rarity}`,
      },

    // Try to make a group of armors 3.0 with the exact same 3 stats focused. This is an easy win for identifying better/worse armor.
    exampleItem.destinyVersion === 2 &&
      archetype &&
      tertiaryStat &&
      tertiaryStatDisplay && {
        buttonLabel: [
          <PressTip minimal tooltip={archetype.displayProperties.name} key="1">
            <BungieImage
              className={clsx(styles.intrinsicIcon, 'dontInvert')}
              src={archetype.displayProperties.icon}
            />
          </PressTip>,
          '+',
          <BungieImage key="tertiary" src={tertiaryStatDisplay.icon} />,
          <BungieImage key="rarity" src={rarityIcons.Legendary} className="dontInvert" />,
          <ArmorSlotIcon key="slot" item={exampleItem} className={styles.svgIcon} />,
        ],
        query: `${modernArmor} perk:${quoteFilterString(archetype.displayProperties.name)} tertiarystat:${tertiaryStat} is:${exampleItem.rarity}`,
      },

    // exotic class items
    ...extraIntrinsicButtons,

    // basically stuff with the same name & categories
    {
      buttonLabel: [exampleItem.name],
      // TODO: I'm gonna get in trouble for this but I think it should just match on name which includes reissues. The old logic used dupeID which is more discriminating.
      query: compareNameQuery(exampleItem),
    },
  ]).reverse();
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
      s.statHash === (i.destinyVersion === 1 ? i.stats![0].statHash : StatHashes.RoundsPerMinute),
  );
  return itemRpmStat?.value || -99999999;
};

/**
 * Generate possible comparisons for weapons, given a reference item.
 */
export function findSimilarWeapons(exampleItem: DimItem): CompareButton[] {
  const intrinsic = getWeaponArchetype(exampleItem);
  const intrinsicName = intrinsic?.displayProperties.name || t('Compare.Archetype');
  const adeptStripped = stripAdept(exampleItem.name);

  let comparisonSets: CompareButton[] = compact([
    // same weapon type
    {
      // TODO: replace typeName with a lookup of itemCategoryHash
      buttonLabel: [<WeaponTypeIcon key="type" item={exampleItem} className={styles.svgIcon} />],
      query: '', // since we already filter by itemCategoryHash, an empty query gives you all items matching that category
    },

    // above but also has to be legendary
    exampleItem.destinyVersion === 2 &&
      exampleItem.rarity === 'Legendary' && {
        buttonLabel: [
          <BungieImage key="rarity" src={rarityIcons.Legendary} className="dontInvert" />,
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
      query: `(${bucketToSearch[exampleItem.bucket.hash as keyof typeof bucketToSearch]} ${
        exampleItem.destinyVersion === 2 && intrinsic
          ? `exactperk:${quoteFilterString(intrinsic.displayProperties.name)}`
          : `stat:rpm:${getRpm(exampleItem)}`
      })`,
    },

    // above, but also same (kinetic/energy/heavy) slot
    {
      buttonLabel: [
        <WeaponSlotIcon key="slot" item={exampleItem} className={styles.svgIcon} />,
        <WeaponTypeIcon key="type" item={exampleItem} className={styles.svgIcon} />,
      ],
      query: bucketToSearch[exampleItem.bucket.hash as keyof typeof bucketToSearch],
    },

    // same weapon type and also matching element (& usually same-slot because same element)
    exampleItem.element && {
      buttonLabel: [
        <ElementIcon
          key={exampleItem.id}
          element={exampleItem.element}
          className={styles.inlineImageIcon}
        />,
        <WeaponTypeIcon key="type" item={exampleItem} className={styles.svgIcon} />,
      ],
      query: `is:${getItemDamageShortName(exampleItem)}`,
    },

    // exact same weapon, judging by name. might span multiple expansions.
    {
      buttonLabel: [adeptStripped],
      query: compareNameQuery(exampleItem),
    },
  ]);

  comparisonSets = comparisonSets.reverse();
  return comparisonSets;
}
/**
 * Generate possible comparisons for non-armor/weapon, given a reference item
 */
export function defaultComparisons(exampleItem: DimItem): CompareButton[] {
  let comparisonSets: CompareButton[] = [
    // same item type
    {
      // TODO: replace typeName with a lookup of itemCategoryHash
      buttonLabel: [exampleItem.typeName],
      query: '', // since we already filter by itemCategoryHash, an empty query gives you all items matching that category
    },

    // exact same item, judging by name. might span multiple expansions.
    {
      buttonLabel: [exampleItem.name],
      query: compareNameQuery(exampleItem),
    },
  ];

  comparisonSets = comparisonSets.reverse();
  return comparisonSets;
}
