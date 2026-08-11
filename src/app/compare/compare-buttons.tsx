import BungieImage from 'app/dim-ui/BungieImage';
import ElementIcon from 'app/dim-ui/ElementIcon';
import { ArmorSlotIcon, WeaponSlotIcon, WeaponTypeIcon } from 'app/dim-ui/ItemCategoryIcon';
import { PressTip } from 'app/dim-ui/PressTip';
import { SpecialtyModSlotIcon } from 'app/dim-ui/SpecialtyModSlotIcon';
import { t } from 'app/i18next-t';
import ItemIcon, { DefItemIcon } from 'app/inventory/ItemIcon';
import { DimItem, PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { realD2ArmorStatSearchByHash } from 'app/search/d2-known-values';
import { quoteFilterString } from 'app/search/query-parser';
import { AppIcon, asteriskIcon, clearIcon } from 'app/shell/icons';
import { compact, filterMap } from 'app/utils/collections';
import {
  getArmor3StatFocus,
  getItemDamageShortName,
  getSpecialtySocketMetadata,
  isArmor3,
} from 'app/utils/item-utils';
import {
  getArmorArchetype,
  getExtraIntrinsicPerkSockets,
  getIntrinsicArmorPerkSocket,
  getWeaponArchetype,
} from 'app/utils/socket-utils';
import clsx from 'clsx';
import rarityIcons from 'data/d2/engram-rarity-icons.json' with { type: 'json' };
import { BucketHashes, StatHashes } from 'data/d2/generated-enums';
import React from 'react';
import * as styles from './CompareButtons.m.scss';
import { compareNameQuery, stripAdept } from './compare-utils';

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
  const exampleItemModSlotMetadata = getSpecialtySocketMetadata(exampleItem);
  const exampleItemIntrinsic =
    !exampleItem.isExotic && getIntrinsicArmorPerkSocket(exampleItem)?.plugged?.plugDef;

  const focusedStats = isArmor3(exampleItem) && getArmor3StatFocus(exampleItem);
  const tertiaryStatHash = focusedStats && focusedStats[2];
  focusedStats && focusedStats.sort();

  const focusedStatsDisplayProperties =
    focusedStats &&
    focusedStats.map((h) => exampleItem.stats!.find((s) => s.statHash === h)!.displayProperties);
  const archetype = getArmorArchetype(exampleItem);
  const tertiaryStat = tertiaryStatHash && realD2ArmorStatSearchByHash[tertiaryStatHash];
  const tertiaryStatDisplayProperties =
    tertiaryStatHash &&
    exampleItem.stats!.find((s) => s.statHash === tertiaryStatHash)!.displayProperties;

  function perkIcon(perk: PluggableInventoryItemDefinition) {
    return (
      <PressTip
        minimal
        elementType="span"
        tooltip={perk.displayProperties.name}
        className={styles.svgIcon}
        key="1"
      >
        <DefItemIcon itemDef={perk} />
      </PressTip>
    );
  }
  const perkQuery = (perk: PluggableInventoryItemDefinition) =>
    `perk:${quoteFilterString(perk.displayProperties.name)}`;

  // exotic class item perks
  const extraIntrinsicButtons =
    (exampleItem.destinyVersion === 2 &&
      filterMap(getExtraIntrinsicPerkSockets(exampleItem), (s) => s.plugged?.plugDef)
        ?.map((intrinsic) => ({
          buttonLabel: [perkIcon(intrinsic), intrinsic.displayProperties.name],
          query: perkQuery(intrinsic),
        }))
        .reverse()) ||
    [];

  return compact([
    // same slot on the same class
    {
      buttonLabel: [<AppIcon key="icon" icon={asteriskIcon} />],
      query: '', // since we already filter by itemCategoryHash, an empty query gives you all items matching that category
    },

    {
      buttonLabel: [
        exampleItem.rarity in rarityIcons ? (
          <BungieImage
            key="rarity"
            src={rarityIcons[exampleItem.rarity as 'Legendary' | 'Exotic']}
            className="dontInvert"
          />
        ) : (
          exampleItem.rarity
        ),
      ],
      query: `is:${exampleItem.rarity}`,
    },

    // above but also the same seasonal mod slot, if it has one
    exampleItemModSlotMetadata && {
      buttonLabel: [
        <SpecialtyModSlotIcon className={styles.inlineImageIcon} key="1" item={exampleItem} />,
      ],
      query: `modslot:${exampleItemModSlotMetadata.slotTag || 'none'}`,
    },

    // above but also the same special intrinsic, if it has one
    exampleItemIntrinsic && {
      buttonLabel: [perkIcon(exampleItemIntrinsic)],
      query: perkQuery(exampleItemIntrinsic),
    },

    // Try to make a group of armors 3.0 with the exact same 3 stats focused. This is an easy win for identifying better/worse armor.
    focusedStatsDisplayProperties && {
      buttonLabel: focusedStatsDisplayProperties.map((s, index) => (
        <React.Fragment key={s.name}>
          {index > 0 && '+'}
          <span title={s.name}>
            <BungieImage src={s.icon} />
          </span>
        </React.Fragment>
      )),
      query: `is:armor3.0 ${focusedStats.map((h) => `basestat:${realD2ArmorStatSearchByHash[h]}:>0`).join(' ')}`,
    },

    // Try to make a group of armors 3.0 with the exact same 3 stats focused and the same archetype. This is an easy win for identifying better/worse armor.
    archetype &&
      tertiaryStat &&
      tertiaryStatDisplayProperties && {
        buttonLabel: [
          perkIcon(archetype),
          '+',
          <span title={tertiaryStatDisplayProperties.name} key="tertiary">
            <BungieImage src={tertiaryStatDisplayProperties.icon} />
          </span>,
        ],
        query: `${perkQuery(archetype)} tertiarystat:${tertiaryStat}`,
      },

    // exotic class items
    ...extraIntrinsicButtons,

    // Try to make a group of armors 3.0 with the same archetype.
    archetype && {
      buttonLabel: [perkIcon(archetype)],
      query: perkQuery(archetype),
    },

    // basically stuff with the same name & categories
    {
      buttonLabel: [<ItemIcon key="icon" item={exampleItem} className={styles.itemIcon} />],
      query: compareNameQuery(exampleItem),
    },
    // Exact armor based on ID
    {
      buttonLabel: [<AppIcon key="icon" icon={clearIcon} />],
      query: `id:${exampleItem.id}`,
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

export function weaponTypeIcon(exampleItem: DimItem) {
  return <WeaponTypeIcon key="type" item={exampleItem} className={styles.svgIcon} />;
}

export function armorSlotIcon(exampleItem: DimItem) {
  return <ArmorSlotIcon key="type" item={exampleItem} className={styles.svgIcon} />;
}

/**
 * Generate possible comparisons for weapons, given a reference item.
 */
export function findSimilarWeapons(exampleItem: DimItem): CompareButton[] {
  const archetype = getWeaponArchetype(exampleItem);
  const archetypeName = archetype?.displayProperties.name || t('Compare.Archetype');
  const adeptStripped = stripAdept(exampleItem.name);
  const bucketHash: keyof typeof bucketToSearch = exampleItem.bucket.hash;

  const archetypeIcon = archetype && (
    <PressTip minimal elementType="span" tooltip={archetypeName} className={styles.svgIcon}>
      <DefItemIcon itemDef={archetype} />
    </PressTip>
  );
  const archetypeQuery =
    exampleItem.destinyVersion === 2 && archetype
      ? `exactperk:${quoteFilterString(archetype.displayProperties.name)}`
      : `stat:rpm:${getRpm(exampleItem)}`;

  const elementIcon = (
    <ElementIcon
      key={exampleItem.id}
      element={exampleItem.element}
      className={clsx(styles.inlineImageIcon, 'dontInvert')}
    />
  );
  const elementQuery = exampleItem.element ? `is:${getItemDamageShortName(exampleItem)}` : '';

  const slotIcon = <WeaponSlotIcon key="slot" item={exampleItem} className={styles.svgIcon} />;
  const slotQuery = bucketToSearch[bucketHash];

  let comparisonSets: CompareButton[] = compact([
    {
      buttonLabel: [<AppIcon key="icon" icon={asteriskIcon} />],
      query: '', // since we already filter by itemCategoryHash, an empty query gives you all items matching that category
    },

    {
      buttonLabel: [slotIcon],
      query: slotQuery,
    },

    exampleItem.element && {
      buttonLabel: [elementIcon],
      query: elementQuery,
    },

    archetype && {
      buttonLabel: [archetypeIcon, slotIcon],
      query: `(${archetypeQuery} ${slotQuery})`,
    },

    exampleItem.element && {
      buttonLabel: [archetypeIcon, elementIcon],
      query: `(${archetypeQuery} ${elementQuery} )`,
    },

    // same waepon frame and also matching element
    {
      buttonLabel: [
        intrinsicName,
        <ElementIcon
          key={exampleItem.id}
          element={exampleItem.element}
          className={clsx(styles.inlineImageIcon, 'dontInvert')}
        />,
        <WeaponTypeIcon key="type" item={exampleItem} className={styles.svgIcon} />,
      ],
      query: `(is:${getItemDamageShortName(exampleItem)} ${
        exampleItem.destinyVersion === 2 && intrinsic
          ? `exactperk:${quoteFilterString(intrinsic.displayProperties.name)}`
          : `stat:rpm:${getRpm(exampleItem)}`
      })`,
    },

    // exact same weapon, judging by name. might span multiple expansions.
    {
      buttonLabel: [adeptStripped],
      query: compareNameQuery(exampleItem),
    },
    // Exact weapon based on ID
    {
      buttonLabel: [<AppIcon key="icon" icon={clearIcon} />],
      query: `id:${exampleItem.id}`,
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
      buttonLabel: [<AppIcon key="icon" icon={asteriskIcon} />],
      query: '', // since we already filter by itemCategoryHash, an empty query gives you all items matching that category
    },

    // exact same item, judging by name. might span multiple expansions.
    {
      buttonLabel: [exampleItem.name],
      query: compareNameQuery(exampleItem),
    },
    // Exact item based on ID
    {
      buttonLabel: [<AppIcon key="icon" icon={clearIcon} />],
      query: `id:${exampleItem.id}`,
    },
  ];

  comparisonSets = comparisonSets.reverse();
  return comparisonSets;
}
