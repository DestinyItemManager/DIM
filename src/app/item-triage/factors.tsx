import BungieImage from 'app/dim-ui/BungieImage';
import ElementIcon from 'app/dim-ui/ElementIcon';
import PressTip from 'app/dim-ui/PressTip';
import { SpecialtyModSlotIcon } from 'app/dim-ui/SpecialtyModSlotIcon';
import { getArmorSvgIcon, getWeaponSvgIcon } from 'app/dim-ui/svgs/itemCategory';
import PlugTooltip from 'app/item-popup/PlugTooltip';
import { nameFilter, quoteFilterString } from 'app/search/search-filters/freeform';
import {
  classFilter,
  damageFilter,
  itemCategoryFilter,
  itemTypeFilter,
} from 'app/search/search-filters/known-values';
import { modslotFilter } from 'app/search/search-filters/sockets';
import { getInterestingSocketMetadatas } from 'app/utils/item-utils';
import { getWeaponArchetype, getWeaponArchetypeSocket } from 'app/utils/socket-utils';
import clsx from 'clsx';
import React from 'react';
import { DimItem } from '../inventory/item-types';
// eslint-disable-next-line css-modules/no-unused-class
import styles from './ItemTriage.m.scss';

/** a factor of interest */
interface Factor {
  id: string;
  /** bother checking this factor, if the seed item returns truthy */
  runIf(item: DimItem): unknown;
  render(item: DimItem): React.ReactElement | null;
  filter(item: DimItem): string;
}
// factors someone might value in an item, like its mod slot or its element
const itemFactors: Record<string, Factor> = {
  class: {
    id: 'class',
    runIf: () => true,
    render: () => null,
    // render: (item) => (
    //   <PressTip elementType="span" tooltip={item.classTypeNameLocalized}>
    //     <ClassIcon classType={item.classType} className={styles.classIcon} />
    //   </PressTip>
    // ),
    filter: classFilter.fromItem!,
  },
  name: {
    id: 'name',
    runIf: (item) => item.bucket.inWeapons,
    render: (item) => (
      <>
        <BungieImage className={styles.inlineIcon} src={item.icon} /> {item.name}
      </>
    ),
    filter: nameFilter.fromItem!,
  },
  element: {
    id: 'element',
    runIf: (item) => item.element,
    render: (item) => (
      <PressTip elementType="span" tooltip={item.element?.displayProperties.name}>
        <ElementIcon className={clsx(styles.inlineIcon, styles.smaller)} element={item.element} />
      </PressTip>
    ),
    filter: damageFilter.fromItem!,
  },
  weaponType: {
    id: 'weaponType',
    runIf: (item) => item.bucket.inWeapons,
    render: (item) => {
      const weaponIcon = getWeaponSvgIcon(item);
      return weaponIcon ? (
        <PressTip elementType="span" tooltip={item.typeName}>
          <img
            className={clsx(styles.inlineIcon, styles.smaller, styles.weaponSvg)}
            src={getWeaponSvgIcon(item)}
          />
        </PressTip>
      ) : (
        <>{item.typeName}</>
      );
    },
    filter: itemCategoryFilter.fromItem!,
  },
  specialtySocket: {
    id: 'specialtySocket',
    runIf: getInterestingSocketMetadatas,
    render: (item) => (
      <SpecialtyModSlotIcon className={styles.inlineIcon} item={item} lowRes onlyInteresting />
    ),
    filter: modslotFilter.fromItem!,
  },
  armorSlot: {
    id: 'armorSlot',
    runIf: (item) => item.bucket.inArmor,
    render: (item) => (
      <PressTip elementType="span" tooltip={item.typeName}>
        <img src={getArmorSvgIcon(item)} className={clsx(styles.inlineIcon, styles.weaponSvg)} />
      </PressTip>
    ),
    filter: itemTypeFilter.fromItem!,
  },
  archetype: {
    id: 'archetype',
    runIf: (item) => getWeaponArchetype(item),
    render: (item) => {
      const archetypeSocket = getWeaponArchetypeSocket(item);
      return (
        <>
          {archetypeSocket?.plugged && (
            <PressTip
              elementType="span"
              tooltip={<PlugTooltip item={item} plug={archetypeSocket.plugged} />}
            >
              <BungieImage
                className={styles.inlineIcon}
                src={archetypeSocket.plugged.plugDef.displayProperties.icon}
              />
            </PressTip>
          )}
        </>
      );
    },
    filter: (item) =>
      `perkname:${quoteFilterString(getWeaponArchetype(item)!.displayProperties.name)}`,
  },
};

// which factors to check for which buckets
export const factorCombos = {
  Weapons: [
    [itemFactors.element, itemFactors.weaponType],
    [itemFactors.archetype, itemFactors.weaponType],
  ],
  Armor: [
    [itemFactors.class, itemFactors.element, itemFactors.specialtySocket, itemFactors.armorSlot],
    [itemFactors.class, itemFactors.element, itemFactors.specialtySocket],
    [itemFactors.name],
  ],
  General: [[itemFactors.element]],
};
export type FactorComboCategory = keyof typeof factorCombos;
export const factorComboCategories = Object.keys(factorCombos);

export function getItemFactorComboDisplays(exampleItem: DimItem) {
  if (!exampleItem.bucket.sort || !factorComboCategories.includes(exampleItem.bucket.sort)) {
    return [];
  }
  return factorCombos[exampleItem.bucket.sort as FactorComboCategory]
    .filter((factorCombo) => factorCombo.every((factor) => factor.runIf(exampleItem)))
    .map((factorCombo) => renderFactorCombo(exampleItem, factorCombo));
}

function renderFactorCombo(exampleItem: DimItem, factorCombo: Factor[]) {
  return (
    <div className={styles.factorCombo}>
      {factorCombo.map((factor) => (
        <React.Fragment key={factor.id}>{factor.render(exampleItem)}</React.Fragment>
      ))}
    </div>
  );
}
