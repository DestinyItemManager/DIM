import { stripAdept } from 'app/compare/compare-buttons';
import BungieImage from 'app/dim-ui/BungieImage';
import ElementIcon from 'app/dim-ui/ElementIcon';
import PressTip from 'app/dim-ui/PressTip';
import { SpecialtyModSlotIcon } from 'app/dim-ui/SpecialtyModSlotIcon';
import { getArmorSlotSvgIcon, getWeaponTypeSvgIcon } from 'app/dim-ui/svgs/itemCategory';
import { DimItem } from 'app/inventory/item-types';
import { DefItemIcon } from 'app/inventory/ItemIcon';
import { DimPlugTooltip } from 'app/item-popup/PlugTooltip';
import { quoteFilterString } from 'app/search/query-parser';
import {
  classFilter,
  damageFilter,
  itemCategoryFilter,
  itemTypeFilter,
} from 'app/search/search-filters/known-values';
import { modslotFilter } from 'app/search/search-filters/sockets';
import { getInterestingSocketMetadatas } from 'app/utils/item-utils';
import {
  getIntrinsicArmorPerkSocket,
  getWeaponArchetype,
  getWeaponArchetypeSocket,
} from 'app/utils/socket-utils';
import clsx from 'clsx';
import React from 'react';
import styles from './TriageFactors.m.scss';

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
  runIf(item: DimItem): unknown;
  render(item: DimItem): React.ReactElement | null;
  filter(item: DimItem): string;
}

export type FactorComboCategory = keyof typeof factorCombos;

const itemFactors: Record<string, Factor> = {
  class: {
    id: 'class',
    runIf: () => true,
    render: () => null,
    // let's probably not show class icon for now. just invisibly include it in the considerations.
    // render: (item) => (<PressTip minimal elementType="span" tooltip={item.classTypeNameLocalized}><ClassIcon classType={item.classType} className={styles.classIcon} /></PressTip>),
    filter: classFilter.fromItem!,
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
    filter: (item) => `name:"${stripAdept(item.name)}"`,
  },
  element: {
    id: 'element', //             don't compare exotic weapon elements, that's silly.
    runIf: (item) => item.element && !(item.isExotic && item.bucket.inWeapons),
    render: (item) => (
      <PressTip minimal elementType="span" tooltip={item.element?.displayProperties.name}>
        <ElementIcon className={clsx(styles.inlineIcon2)} element={item.element} />
      </PressTip>
    ),
    filter: damageFilter.fromItem!,
  },
  weaponType: {
    id: 'weaponType',
    runIf: (item) => item.bucket.inWeapons,
    render: (item) => {
      const weaponIcon = getWeaponTypeSvgIcon(item);
      return weaponIcon ? (
        <PressTip minimal elementType="span" tooltip={item.typeName}>
          <img className={clsx(styles.inlineIcon2, styles.weaponSvg)} src={weaponIcon} />
        </PressTip>
      ) : (
        <>{item.typeName}</>
      );
    },
    filter: itemCategoryFilter.fromItem!,
  },
  specialtySocket: {
    id: 'specialtySocket',
    runIf: (i) =>
      getInterestingSocketMetadatas(i) || (!i.isExotic && getIntrinsicArmorPerkSocket(i)),
    render: (item) => {
      const found: JSX.Element[] = [];

      const intrinsicArmorPerk = getIntrinsicArmorPerkSocket(item)?.plugged;
      if (intrinsicArmorPerk) {
        found.push(
          <PressTip tooltip={() => <DimPlugTooltip item={item} plug={intrinsicArmorPerk} />}>
            <DefItemIcon
              className={styles.factorIcon}
              itemDef={intrinsicArmorPerk.plugDef}
              borderless={true}
            />
          </PressTip>
        );
      }

      const specialty = (
        <SpecialtyModSlotIcon
          className={styles.modSlotIcon}
          item={item}
          lowRes
          excludeStandardD2ModSockets
        />
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
        `perkname:${quoteFilterString(intrinsicPerk.plugDef.displayProperties.name)}`;
      const modSlotFilterString = modslotFilter.fromItem!(item);
      return [largePerkFilterString, modSlotFilterString].filter(Boolean).join(' ');
    },
  },
  armorSlot: {
    id: 'armorSlot',
    runIf: (item) => item.bucket.inArmor,
    render: (item) => (
      <PressTip minimal elementType="span" tooltip={item.typeName}>
        <img
          src={getArmorSlotSvgIcon(item)}
          className={clsx(styles.inlineIcon2, styles.weaponSvg, styles.factorIcon)}
        />
      </PressTip>
    ),
    filter: itemTypeFilter.fromItem!,
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
      `perkname:${quoteFilterString(getWeaponArchetype(item)!.displayProperties.name)}`,
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
    [itemFactors.class, itemFactors.element, itemFactors.specialtySocket, itemFactors.armorSlot],
    [itemFactors.class, itemFactors.element, itemFactors.specialtySocket],
    [itemFactors.class, itemFactors.name],
  ],
  General: [[itemFactors.element]],
};

export const factorComboCategories = Object.keys(factorCombos);
