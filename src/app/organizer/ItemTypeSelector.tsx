import React, { useMemo } from 'react';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import _ from 'lodash';
import styles from './ItemTypeSelector.m.scss';
import clsx from 'clsx';

import autoRifle from 'destiny-icons/weapons/auto_rifle.svg';
import bow from 'destiny-icons/weapons/bow.svg';
import fusionRifle from 'destiny-icons/weapons/fusion_rifle.svg';
import gLauncher from 'destiny-icons/weapons/grenade_launcher.svg';
import handCannon from 'destiny-icons/weapons/hand_cannon.svg';
import lFusionRifle from 'destiny-icons/weapons/wire_rifle.svg';
import machinegun from 'destiny-icons/weapons/machinegun.svg';
import pulseRifle from 'destiny-icons/weapons/pulse_rifle.svg';
import rLauncher from 'destiny-icons/weapons/rocket_launcher.svg';
import scoutRifle from 'destiny-icons/weapons/scout_rifle.svg';
import shotgun from 'destiny-icons/weapons/shotgun.svg';
import sidearm from 'destiny-icons/weapons/sidearm.svg';
import smg from 'destiny-icons/weapons/smg.svg';
import sniperRifle from 'destiny-icons/weapons/sniper_rifle.svg';
import sword from 'destiny-icons/weapons/sword_heavy.svg';
import traceRifle from 'destiny-icons/weapons/beam_weapon.svg';
import helmet from '../../../destiny-icons/armor_types/helmet.svg';
import gauntlets from '../../../destiny-icons/armor_types/gloves.svg';
import chest from '../../../destiny-icons/armor_types/chest.svg';
import legs from '../../../destiny-icons/armor_types/boots.svg';
import classItem from '../../../destiny-icons/armor_types/class.svg';
import titan from '../../../destiny-icons/general/class_titan.svg';
import hunter from '../../../destiny-icons/general/class_hunter.svg';
import warlock from '../../../destiny-icons/general/class_warlock.svg';
import dmgKinetic from 'destiny-icons/weapons/damage_kinetic.svg';
import energyWeapon from 'destiny-icons/general/energy_weapon.svg';
import powerWeapon from 'destiny-icons/general/power_weapon.svg';
import ghost from 'destiny-icons/general/ghost.svg';
import { D1ManifestDefinitions } from 'app/destiny1/d1-definitions';
import { ItemCategoryHashes } from 'data/d2/generated-enums';

/**
 * Each branch of the drilldown options is represented by a SelectionTreeNode
 * which tells which item category to filter with, as well as what sub-categories
 * can still be drilled down into.
 */
export interface ItemCategoryTreeNode {
  id: string;
  itemCategoryHash: number;
  subCategories?: ItemCategoryTreeNode[];
  /** A terminal node can have items displayed for it. It may still have other drilldowns available. */
  terminal?: boolean;
  icon?: string;
}

const armorHashes = {
  45: helmet,
  46: gauntlets,
  47: chest,
  48: legs,
  49: classItem,
};

/**
 * Generate a tree of all the drilldown options for item filtering. This tree is
 * used to generate the list of selected subcategories.
 */
export const getD2SelectionTree = (defs: D2ManifestDefinitions): ItemCategoryTreeNode => {
  const armorCategory = defs.ItemCategory.get(ItemCategoryHashes.Armor);

  // Each class has the same armor
  const armorCategories = armorCategory.groupedCategoryHashes.map(
    (categoryHash): ItemCategoryTreeNode => {
      const category = defs.ItemCategory.get(categoryHash);
      return {
        id: category.originBucketIdentifier,
        itemCategoryHash: categoryHash,
        terminal: true,
        icon: armorHashes[categoryHash],
      };
    }
  );

  // Each weapon type may be in several subcategories
  const kinetic: ItemCategoryTreeNode = {
    id: 'kinetic',
    itemCategoryHash: 2,
    terminal: true,
    icon: dmgKinetic,
  };
  const energy: ItemCategoryTreeNode = {
    id: 'energy',
    itemCategoryHash: 3,
    terminal: true,
    icon: energyWeapon,
  };
  const power: ItemCategoryTreeNode = {
    id: 'power',
    itemCategoryHash: 4,
    terminal: true,
    icon: powerWeapon,
  };

  return {
    id: 'all',
    itemCategoryHash: 0,
    subCategories: [
      {
        id: 'weapons',
        itemCategoryHash: 1,
        icon: handCannon,
        subCategories: [
          {
            id: 'autorifle',
            itemCategoryHash: 5,
            subCategories: [kinetic, energy],
            terminal: true,
            icon: autoRifle,
          },
          {
            id: 'handcannon',
            itemCategoryHash: 6,
            subCategories: [kinetic, energy],
            terminal: true,
            icon: handCannon,
          },
          {
            id: 'pulserifle',
            itemCategoryHash: 7,
            subCategories: [kinetic, energy],
            terminal: true,
            icon: pulseRifle,
          },
          {
            id: 'scoutrifle',
            itemCategoryHash: 8,
            subCategories: [kinetic, energy],
            terminal: true,
            icon: scoutRifle,
          },
          {
            id: 'sidearm',
            itemCategoryHash: 14,
            subCategories: [kinetic, energy],
            terminal: true,
            icon: sidearm,
          },
          {
            id: 'bow',
            itemCategoryHash: 3317538576,
            subCategories: [kinetic, energy, power],
            terminal: true,
            icon: bow,
          },
          {
            id: 'submachine',
            itemCategoryHash: 3954685534,
            subCategories: [kinetic, energy],
            terminal: true,
            icon: smg,
          },
          {
            id: 'fusionrifle',
            itemCategoryHash: 9,
            subCategories: [energy, power],
            terminal: true,
            icon: fusionRifle,
          },
          {
            id: 'sniperrifle',
            itemCategoryHash: 10,
            subCategories: [kinetic, energy, power],
            terminal: true,
            icon: sniperRifle,
          },
          {
            id: 'shotgun',
            itemCategoryHash: 11,
            subCategories: [kinetic, energy, power],
            terminal: true,
            icon: shotgun,
          },
          {
            id: 'tracerifle',
            itemCategoryHash: 2489664120,
            subCategories: [kinetic, energy],
            terminal: true,
            icon: traceRifle,
          },
          {
            id: 'machinegun',
            itemCategoryHash: 12,
            terminal: true,
            icon: machinegun,
          },
          {
            id: 'sword',
            itemCategoryHash: 54,
            terminal: true,
            icon: sword,
          },
          {
            id: 'grenadelauncher',
            itemCategoryHash: 153950757,
            subCategories: [kinetic, energy, power],
            terminal: true,
            icon: gLauncher,
          },
          {
            id: 'rocketlauncher',
            itemCategoryHash: 13,
            terminal: true,
            icon: rLauncher,
          },
          {
            id: 'linearfusionrifle',
            itemCategoryHash: 1504945536,
            subCategories: [kinetic, power],
            terminal: true,
            icon: lFusionRifle,
          },
        ],
      },
      {
        id: 'hunter',
        itemCategoryHash: 23,
        subCategories: armorCategories,
        icon: hunter,
      },
      {
        id: 'titan',
        itemCategoryHash: 22,
        subCategories: armorCategories,
        icon: titan,
      },
      {
        id: 'warlock',
        itemCategoryHash: 21,
        subCategories: armorCategories,
        icon: warlock,
      },
      {
        id: 'ghosts',
        itemCategoryHash: 39,
        icon: ghost,
        terminal: true,
      },
    ],
  };
};

/**
 * Generate a tree of all the drilldown options for item filtering. This tree is
 * used to generate the list of selected subcategories.
 */
export const getD1SelectionTree = (): ItemCategoryTreeNode => {
  // Each class has the same armor
  const armorCategories = [
    {
      id: 'helmets',
      itemCategoryHash: 45,
      terminal: true,
      icon: helmet,
    },
    {
      id: 'gauntlets',
      itemCategoryHash: 46,
      terminal: true,
      icon: gauntlets,
    },
    {
      id: 'chests',
      itemCategoryHash: 47,
      terminal: true,
      icon: chest,
    },
    {
      id: 'legs',
      itemCategoryHash: 48,
      terminal: true,
      icon: legs,
    },
    {
      id: 'classItems',
      itemCategoryHash: 49,
      terminal: true,
      icon: classItem,
    },
    {
      id: 'artifacts',
      itemCategoryHash: 38,
      terminal: true,
    },
  ];

  return {
    id: 'all',
    itemCategoryHash: 0,
    subCategories: [
      {
        id: 'weapons',
        itemCategoryHash: 1,
        icon: handCannon,
        subCategories: [
          {
            id: 'autorifle',
            itemCategoryHash: 5,
            terminal: true,
            icon: autoRifle,
          },
          {
            id: 'handcannon',
            itemCategoryHash: 6,
            terminal: true,
            icon: handCannon,
          },
          {
            id: 'pulserifle',
            itemCategoryHash: 7,
            terminal: true,
            icon: pulseRifle,
          },
          {
            id: 'scoutrifle',
            itemCategoryHash: 8,
            terminal: true,
            icon: scoutRifle,
          },
          {
            id: 'fusionrifle',
            itemCategoryHash: 9,
            terminal: true,
            icon: fusionRifle,
          },
          {
            id: 'sniperrifle',
            itemCategoryHash: 10,
            terminal: true,
            icon: sniperRifle,
          },
          {
            id: 'shotgun',
            itemCategoryHash: 11,
            terminal: true,
            icon: shotgun,
          },
          {
            id: 'machinegun',
            itemCategoryHash: 12,
            terminal: true,
            icon: machinegun,
          },
          {
            id: 'rocketlauncher',
            itemCategoryHash: 13,
            terminal: true,
            icon: rLauncher,
          },
          {
            id: 'sidearm',
            itemCategoryHash: 14,
            terminal: true,
            icon: sidearm,
          },
          {
            id: 'sword',
            itemCategoryHash: 54,
            terminal: true,
            icon: sword,
          },
        ],
      },
      {
        id: 'armor',
        itemCategoryHash: 20,
        icon: helmet,
        subCategories: [
          {
            id: 'hunter',
            itemCategoryHash: 23,
            subCategories: armorCategories,
            icon: hunter,
          },
          {
            id: 'titan',
            itemCategoryHash: 22,
            subCategories: armorCategories,
            icon: titan,
          },
          {
            id: 'warlock',
            itemCategoryHash: 21,
            subCategories: armorCategories,
            icon: warlock,
          },
        ],
      },
      {
        id: 'ghosts',
        itemCategoryHash: 39,
        icon: ghost,
        terminal: true,
      },
    ],
  };
};

/**
 * This component offers a means for narrowing down your selection to a single item type
 * (hunter helmets, hand cannons, etc.) for the Organizer table.
 */
export default function ItemTypeSelector({
  defs,
  selection,
  onSelection,
}: {
  defs: D2ManifestDefinitions | D1ManifestDefinitions;
  selection: ItemCategoryTreeNode[];
  onSelection(selection: ItemCategoryTreeNode[]): void;
}) {
  const types = useMemo(
    () => (defs.isDestiny2() ? getD2SelectionTree(defs) : getD1SelectionTree()),
    [defs]
  );
  selection = selection.length ? selection : [types];

  const handleSelection = (depth: number, subCategory: ItemCategoryTreeNode) =>
    onSelection([..._.take(selection, depth + 1), subCategory]);

  return (
    <div className={styles.selector}>
      {selection.map(
        (currentSelection, depth) =>
          currentSelection.subCategories && (
            <div key={depth} className={styles.level}>
              {currentSelection.subCategories?.map((subCategory) => (
                <label
                  key={subCategory.itemCategoryHash}
                  className={clsx(styles.button, {
                    [styles.checked]: selection[depth + 1] === subCategory,
                  })}
                >
                  <input
                    type="radio"
                    name={subCategory.id}
                    value={subCategory.id}
                    checked={selection[depth + 1] === subCategory}
                    readOnly={true}
                    onClick={(_e) => handleSelection(depth, subCategory)}
                  />
                  {subCategory.icon && <img src={subCategory.icon} />}
                  {defs.ItemCategory.get(subCategory.itemCategoryHash).displayProperties?.name ||
                    defs.ItemCategory.get(subCategory.itemCategoryHash).title}
                </label>
              ))}
            </div>
          )
      )}
    </div>
  );
}
