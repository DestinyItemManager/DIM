import { D2Categories } from 'app/destiny2/d2-bucket-categories';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import BungieImage from 'app/dim-ui/BungieImage';
import ElementIcon from 'app/dim-ui/ElementIcon';
import Select, { Option } from 'app/dim-ui/Select';
import SpecialtyModSlotIcon from 'app/dim-ui/SpecialtyModSlotIcon';
import { getItemSvgIcon } from 'app/dim-ui/svgs/itemCategory';
import { getWeaponArchetype } from 'app/dim-ui/WeaponArchetype';
import { DimItem } from 'app/inventory/item-types';
import { allItemsSelector } from 'app/inventory/selectors';
import { itemCategoryIcons } from 'app/organizer/item-category-icons';
import { damageNamesByEnum, energyNamesByEnum } from 'app/search/d2-known-values';
import { classes, itemCategoryHashesByName } from 'app/search/search-filters/known-values';
import { RootState } from 'app/store/types';
import {
  getItemDamageShortName,
  getItemSpecialtyModSlotDisplayNames,
  getSpecialtySocketMetadatas,
} from 'app/utils/item-utils';
// import { damageTypeNames } from 'app/search/search-filter-values';
import { DamageType, DestinyEnergyType } from 'bungie-api-ts/destiny2';
import { ItemCategoryHashes } from 'data/d2/generated-enums';
import _ from 'lodash';
import React, { useState } from 'react';
import { connect } from 'react-redux';
import './QueryBuilder.scss';

// const notArmor = ['kinetic', 'stasis'];
// const armorElements = damageTypeNames.filter((d) => !notArmor.includes(d));

// const damageNames = damageNamesByEnum

const classNameToICH = {
  hunter: ItemCategoryHashes.Hunter,
  titan: ItemCategoryHashes.Titan,
  warlock: ItemCategoryHashes.Warlock,
};

const armorEnergyTypes = [DestinyEnergyType.Arc, DestinyEnergyType.Thermal, DestinyEnergyType.Void];
const weaponDamageTypes = [DamageType.Kinetic, DamageType.Arc, DamageType.Thermal, DamageType.Void];

const itemCategoryFilterNamesByItemCategoryHash = _.invert(itemCategoryHashesByName);

interface ProvidedProps {
  exampleItem?: DimItem;
  onQueryChange: (q: string) => void;
}

interface StoreProps {
  defs: D2ManifestDefinitions;
  allItems: DimItem[];
}

function mapStateToProps() {
  return (state: RootState): StoreProps => ({
    defs: state.manifest.d2Manifest!,
    allItems: allItemsSelector(state),
  });
}

type Props = ProvidedProps & StoreProps;

function QueryBuilderBuilder({ exampleItem, defs, allItems, onQueryChange }: Props) {
  const defaultMainSelection = exampleItem?.bucket.inWeapons ? 'weapon' : 'armor';

  const defaults: NodeJS.Dict<string> = {};
  defaults.energy = `is:${
    (exampleItem?.bucket.inArmor && getItemDamageShortName(exampleItem)) || 'arc'
  }`;

  defaults.dmg = `is:${
    (exampleItem?.bucket.inWeapons && getItemDamageShortName(exampleItem)) || 'arc'
  }`;

  const defaultCategoryHash = exampleItem?.itemCategoryHashes.slice(-1)[0];

  defaults.weaponType = `is:${
    (defaultCategoryHash && itemCategoryFilterNamesByItemCategoryHash[defaultCategoryHash]) ||
    'autorifle'
  }`; // you're not allowed to not select a weapon type

  const exampleArchetype = exampleItem && getWeaponArchetype(exampleItem)?.displayProperties.name;
  defaults.archetype = exampleArchetype && `perk:"${exampleArchetype}"`;

  const exampleSpecialtySlots = exampleItem && getSpecialtySocketMetadatas(exampleItem);

  defaults.specialty =
    (exampleSpecialtySlots &&
      (exampleSpecialtySlots.length === 1
        ? `modslot:${exampleSpecialtySlots[0].slotTag}`
        : `(${exampleSpecialtySlots.map((m) => `modslot:${m.slotTag}`).join(' ')})`)) ||
    'modslot:combatstyle';

  defaults.armorSlot = `is:${
    (exampleItem?.bucket.inArmor && exampleItem.type.toLowerCase()) || 'helmet'
  }`;
  defaults.classname = `is:${
    (exampleItem?.bucket.inArmor && classes[exampleItem.classType]) || 'hunter'
  }`;

  const {
    energy,
    dmg,
    weaponType,
    archetype,
    specialty,
    armorSlot,
    classname,
  } = generateOptionSets(defs, allItems);

  const optionSets: Record<'any' | 'armor' | 'weapon', OptionConfig[]> = {
    any: [],
    armor: [
      {
        key: 'armorSlot',
        options: armorSlot,
        default: defaults.armorSlot,
      },
      {
        key: 'classname',
        options: classname,
        default: defaults.classname,
      },
      {
        key: 'energy',
        options: addUndefinedOption(energy),
        default: defaults.energy,
      },
      {
        key: 'specialty',
        options: addUndefinedOption(specialty),
        default: defaults.specialty,
      },
    ],
    weapon: [
      {
        key: 'dmg',
        options: addUndefinedOption(dmg),
        default: defaults.dmg,
      },
      {
        key: 'weaponType',
        options: weaponType,
        default: defaults.weaponType,
      },
      {
        key: 'archetype',
        hideUnselectable: true,
        options: addUndefinedOption(archetype),
        default: defaults.archetype,
      },
    ],
  };

  if (exampleItem) {
    optionSets[defaultMainSelection].unshift({
      key: 'thisitem',
      options: addUndefinedOption([
        {
          key: 'thisitem',
          value: `name:"${exampleItem.name}"`,
          content: (
            <>
              <BungieImage
                loading="eager"
                className="leadingIcon weaponIcon"
                src={exampleItem.icon}
              />{' '}
              <span>{exampleItem.name}</span>
            </>
          ),
        },
      ]),
      default: `name:"${exampleItem.name}"`,
    });
  }

  return <QueryBuilder {...{ onQueryChange, defaultMainSelection, optionSets }} />;
}

export default connect<StoreProps>(mapStateToProps)(QueryBuilderBuilder);

interface OptionConfig {
  key: string;
  hideUnselectable?: boolean;
  options: Option<string | undefined>[];
  default: string | undefined;
}

export function QueryBuilder({
  defaultMainSelection,
  optionSets,
  onQueryChange,
}: {
  defaultMainSelection: 'weapon' | 'armor';
  optionSets: Record<'any' | 'armor' | 'weapon', OptionConfig[]>;
  onQueryChange: (q: string) => void;
}) {
  // const [currentMainSelection, setCurrentMainSelection] = useState(defaultMainSelection);
  const [currentSelections, setCurrentSelections] = useState(
    Object.values(optionSets)
      .flat()
      .reduce<Record<string, typeof optionSets['any'][number]['default']>>(
        (acc, cur) => ({ ...acc, [cur.key]: cur.default }),
        {}
      )
  );

  const optionSetVisibility = Object.entries(optionSets).reduce<
    Record<'any' | 'armor' | 'weapon', string>
  >(
    (acc, [showForThis, options]) => ({ ...acc, [showForThis]: options.map((o) => o.key) }),
    // eslint-disable-next-line @typescript-eslint/prefer-reduce-type-parameter
    {} as any
  );

  // const mainSelection = [
  //   {
  //     key: 'weapon',
  //     value: 'weapon' as const,
  //     content: <span>{t('Bucket.Weapons')}</span>,
  //   },
  //   {
  //     key: 'armor',
  //     value: 'armor' as const,
  //     content: <span>{t('Bucket.Armor')}</span>,
  //   },
  // ];

  onQueryChange(
    `is:${defaultMainSelection} ` +
      Object.entries(currentSelections)
        .filter(
          ([selectorType]) =>
            optionSetVisibility.any.includes(selectorType) ||
            optionSetVisibility[defaultMainSelection].includes(selectorType)
        )
        .map(([_, selectorValue]) => selectorValue)
        .filter(Boolean)
        .join(' ')
  );

  return (
    <div className={'selectors compare-options'}>
      {/* <Select<'weapon' | 'armor'>
        key="mainSelection"
        options={mainSelection}
        value={currentMainSelection}
        onChange={(v) => setCurrentMainSelection(v === 'weapon' ? 'weapon' : 'armor')}
        hideSelected
      /> */}
      {[...optionSets.any, ...optionSets[defaultMainSelection]].map((os) => {
        // const currentlySelected = os.options.find((o) => o.value === currentSelections[os.key])!;
        // if (!currentlySelected) {
        //   console.log(`looked for ${currentSelections[os.key]} in ${os.key}`);
        //   console.log(os.options);
        // }
        const changeSelection = (v: any) => setCurrentSelections((c) => ({ ...c, [os.key]: v }));
        return (
          <Select
            key={os.key}
            options={os.options}
            value={currentSelections[os.key]}
            onChange={changeSelection}
            hideSelected
          />
        );
      })}

      <br />
      {/* {Object.entries(currentSelections)
        .filter(
          ([selectorType]) =>
            !optionSetVisibility[selectorType] ||
            optionSetVisibility[selectorType] === currentMainSelection
        )
        .map(([_, selectorValue]) => selectorValue)
        .filter(Boolean)
        .join(' ')} */}
    </div>
  );
}

function generateOptionSets(defs: D2ManifestDefinitions, allItems: DimItem[]) {
  const energyOptions: Option<string>[] = Object.values(defs.EnergyType.getAll())
    .filter((et) => armorEnergyTypes.includes(et.enumValue))
    .map((et) => ({
      key: energyNamesByEnum[et.enumValue],
      value: `is:${energyNamesByEnum[et.enumValue]}`,
      content: (
        <>
          <ElementIcon className="leadingIcon element" element={et} />{' '}
          <span>{et.displayProperties.name}</span>
        </>
      ),
    }));

  const damageOptions: Option<string>[] = Object.values(defs.DamageType.getAll())
    .filter((dt) => weaponDamageTypes.includes(dt.enumValue))
    .map((dt) => ({
      key: damageNamesByEnum[dt.enumValue] as string,
      value: `is:${damageNamesByEnum[dt.enumValue]}`,
      content: (
        <>
          <ElementIcon className="leadingIcon element" element={dt} />{' '}
          <span>{dt.displayProperties.name}</span>
        </>
      ),
    }));

  const weaponArchetypes: Option<string>[] = _.uniqBy(
    allItems.filter((i) => getWeaponArchetype(i)),
    (i) => getWeaponArchetype(i)!.displayProperties.name
  ).map((i) => {
    const weaponArchetype = getWeaponArchetype(i)!;
    return {
      key: weaponArchetype.displayProperties.name,
      value: `perk:"${weaponArchetype.displayProperties.name}"`,
      content: (
        <>
          <BungieImage
            className="leadingIcon archetype"
            src={weaponArchetype.displayProperties.icon}
          />{' '}
          <span>{weaponArchetype.displayProperties.name}</span>
        </>
      ),
    };
  });
  const specialtySlotCombos: Option<string>[] = _.uniqBy(
    allItems.filter((i) => getSpecialtySocketMetadatas(i)),
    (i) =>
      getSpecialtySocketMetadatas(i)
        ?.map((m) => m.slotTag)
        .join()
  ).map((i) => {
    const specialtySlots = getSpecialtySocketMetadatas(i)!;

    const key =
      specialtySlots.length === 1
        ? `modslot:${specialtySlots[0].slotTag}`
        : `(${specialtySlots.map((m) => `modslot:${m.slotTag}`).join(' ')})`;
    return {
      key,
      value: key,
      content: (
        <>
          <SpecialtyModSlotIcon className="specialtyIcon" item={i} />{' '}
          <span>{getItemSpecialtyModSlotDisplayNames(i, defs)?.join(' + ')}</span>
        </>
      ),
    };
  });

  const armorSlots: Option<string>[] = D2Categories.Armor.map((at) => {
    const example = allItems.find((i) => i.type.toLowerCase() === at.toLowerCase())!;

    return {
      key: at,
      value: `is:${at.toLowerCase()}`,
      content: (
        <>
          <img className="leadingIcon selectionSvg armorSlotIcon" src={getItemSvgIcon(example)} />{' '}
          <span>{example.typeName}</span>
        </>
      ),
    };
  });
  const classnames: Option<string>[] = classes.map((className) => ({
    key: className,
    value: `is:${className.toLowerCase()}`,
    content: (
      <>
        <img
          className="leadingIcon selectionSvg"
          src={itemCategoryIcons[classNameToICH[className]]}
        />{' '}
        <span>{className}</span>
      </>
    ),
  }));

  const weaponTypeOptions: Option<string>[] = _.uniqBy(
    allItems.filter(
      (i) => i.comparable && i.itemCategoryHashes.includes(ItemCategoryHashes.Weapon)
    ),
    (i) => i.typeName
  ).map((i) => {
    const primaryCategoryHash = i.itemCategoryHashes.slice(-1)[0];
    return {
      key: i.typeName,
      value: `is:${itemCategoryFilterNamesByItemCategoryHash[primaryCategoryHash]}`,
      content: (
        <>
          <img className="leadingIcon selectionSvg" src={getItemSvgIcon(i)} />{' '}
          <span>{i.typeName}</span>
        </>
      ),
    };
  });

  return {
    energy: energyOptions,
    dmg: damageOptions,
    weaponType: weaponTypeOptions,
    archetype: weaponArchetypes,
    specialty: specialtySlotCombos,
    armorSlot: armorSlots,
    classname: classnames,
  };
}

function addUndefinedOption(options: Option<string>[]): Option<string | undefined>[] {
  return [
    {
      key: '—',
      value: undefined,
      content: <span>&mdash;</span>,
    },
    ...options,
  ];
}
