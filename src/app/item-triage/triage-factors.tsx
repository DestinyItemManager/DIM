import { compareNameQuery } from 'app/compare/compare-utils';
import BungieImage from 'app/dim-ui/BungieImage';
import ElementIcon from 'app/dim-ui/ElementIcon';
import { ArmorSlotIcon, WeaponTypeIcon } from 'app/dim-ui/ItemCategoryIcon';
import { PressTip } from 'app/dim-ui/PressTip';
import { SpecialtyModSlotIcon } from 'app/dim-ui/SpecialtyModSlotIcon';
import { DefItemIcon } from 'app/inventory/ItemIcon';
import { DimItem } from 'app/inventory/item-types';
import { DimPlugTooltip } from 'app/item-popup/PlugTooltip';
import {
  classFilter,
  damageFilter,
  itemCategoryFilter,
  itemTypeFilter,
} from 'app/search/items/search-filters/known-values';
import { modslotFilter } from 'app/search/items/search-filters/sockets';
import { quoteFilterString } from 'app/search/query-parser';
import { getSpecialtySocketMetadata } from 'app/utils/item-utils';
import {
  getIntrinsicArmorPerkSocket,
  getWeaponArchetype,
  getWeaponArchetypeSocket,
} from 'app/utils/socket-utils';
import clsx from 'clsx';
import React, { JSX } from 'react';
import * as styles from './TriageFactors.m.scss';

/**
 * A factor is something of interest about an item, that might help you decide to keep it.
 * Something that makes you say "I should keep at least one of these".
 * For instance its element, weapon type, or its unique modslot.
 *
 * A Factor's methods describe how to display it and measure it, and when to use it.
 */
export interface Factor {
  id: string;
  /** bother checking this factor, if the seed item (the one in the item popup) returns truthy */
  runIf: (item: DimItem) => unknown;
  render: (item: DimItem) => React.ReactElement | null;
  filter: (item: DimItem) => string;
}

export type FactorComboCategory = keyof typeof factorCombos;

const itemFactors: Record<string, Factor> = {
  class: {
    id: 'class',
    runIf: () => true,
    render: () => null,
    // let's probably not show class icon for now. just invisibly include it in the considerations.
    // render: (item) => (<PressTip minimal elementType="span" tooltip={item.classTypeNameLocalized}><ClassIcon classType={item.classType} className={styles.classIcon} /></PressTip>),
    filter: classFilter.fromItem,
  },
  name: {
    id: 'name',
    runIf: (item) => item.bucket.inWeapons || (item.bucket.inArmor && item.isExotic),
    render: (item) => (
      <>
        <BungieImage className={styles.inlineIcon2} src={item.icon} />
        <span>{item.name}</span>
      </>
    ),
    filter: (item) => compareNameQuery(item),
  },
  element: {
    id: 'element', // we're done using this for armor as of lightfall
    runIf: (item) => item.element && item.bucket.inWeapons,
    render: (item) => (
      <PressTip minimal elementType="span" tooltip={item.element?.displayProperties.name}>
        <ElementIcon className={styles.factorIcon} element={item.element} />
      </PressTip>
    ),
    filter: damageFilter.fromItem,
  },
  weaponType: {
    id: 'weaponType',
    runIf: (item) => item.bucket.inWeapons,
    render: (item) => <WeaponTypeIcon item={item} className={styles.inlineIcon2} />,
    filter: itemCategoryFilter.fromItem,
  },
  specialtySocket: {
    id: 'specialtySocket',
    runIf: (i) => getSpecialtySocketMetadata(i) || (!i.isExotic && getIntrinsicArmorPerkSocket(i)),
    render: (item) => {
      const found: JSX.Element[] = [];

      const intrinsicArmorPerk = getIntrinsicArmorPerkSocket(item)?.plugged;
      if (intrinsicArmorPerk) {
        found.push(
          <PressTip
            key={intrinsicArmorPerk.plugDef.hash}
            tooltip={() => <DimPlugTooltip item={item} plug={intrinsicArmorPerk} />}
          >
            <DefItemIcon
              className={styles.factorIcon}
              itemDef={intrinsicArmorPerk.plugDef}
              borderless={true}
            />
          </PressTip>,
        );
      }

      const specialty = (
        <SpecialtyModSlotIcon key="specialty" className={styles.modSlotIcon} item={item} />
      );
      if (specialty) {
        found.push(specialty);
      }
      return <>{found}</>;
    },
    filter: (item) => {
      const intrinsicPerk = getIntrinsicArmorPerkSocket(item)?.plugged;
      const largePerkFilterString =
        intrinsicPerk &&
        `exactperk:${quoteFilterString(intrinsicPerk.plugDef.displayProperties.name)}`;
      const modSlotFilterString = modslotFilter.fromItem(item);
      return [largePerkFilterString, modSlotFilterString].filter(Boolean).join(' ');
    },
  },
  armorSlot: {
    id: 'armorSlot',
    runIf: (item) => item.bucket.inArmor,
    render: (item) => (
      <ArmorSlotIcon item={item} className={clsx(styles.inlineIcon2, styles.factorIcon)} />
    ),
    filter: itemTypeFilter.fromItem,
  },
  archetype: {
    id: 'archetype',
    runIf: (item) => !item.isExotic && getWeaponArchetype(item),
    render: (item) => {
      const archetypeSocket = getWeaponArchetypeSocket(item);
      return archetypeSocket?.plugged ? (
        <PressTip
          elementType="span"
          tooltip={<DimPlugTooltip item={item} plug={archetypeSocket.plugged} />}
        >
          <BungieImage
            className={styles.inlineIcon2}
            src={archetypeSocket.plugged.plugDef.displayProperties.icon}
          />
        </PressTip>
      ) : null;
    },
    filter: (item) =>
      `exactperk:${quoteFilterString(getWeaponArchetype(item)!.displayProperties.name)}`,
  },
};

// which factors to check, for which DIM buckets.
// keyed by DimItem.bucket.sort (InventoryBucket.sort)
export const factorCombos = {
  Weapons: [
    [itemFactors.element, itemFactors.weaponType],
    [itemFactors.archetype, itemFactors.weaponType],
    [itemFactors.name],
  ],
  Armor: [
    [itemFactors.class, itemFactors.specialtySocket, itemFactors.armorSlot],
    [itemFactors.class, itemFactors.specialtySocket],
    [itemFactors.class, itemFactors.name],
  ],
  General: [[itemFactors.element]],
};

export const factorComboCategories = Object.keys(factorCombos);
