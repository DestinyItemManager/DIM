import { D1ManifestDefinitions } from 'app/destiny1/d1-definitions';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import clsx from 'clsx';
import { ItemCategoryHashes } from 'data/d2/generated-enums';
import energyWeapon from 'destiny-icons/general/energy_weapon.svg';
import ghost from 'destiny-icons/general/ghost.svg';
import powerWeapon from 'destiny-icons/general/power_weapon.svg';
import autoRifle from 'destiny-icons/weapons/auto_rifle.svg';
import traceRifle from 'destiny-icons/weapons/beam_weapon.svg';
import bow from 'destiny-icons/weapons/bow.svg';
import dmgKinetic from 'destiny-icons/weapons/damage_kinetic.svg';
import fusionRifle from 'destiny-icons/weapons/fusion_rifle.svg';
import gLauncher from 'destiny-icons/weapons/grenade_launcher.svg';
import handCannon from 'destiny-icons/weapons/hand_cannon.svg';
import machinegun from 'destiny-icons/weapons/machinegun.svg';
import pulseRifle from 'destiny-icons/weapons/pulse_rifle.svg';
import rLauncher from 'destiny-icons/weapons/rocket_launcher.svg';
import scoutRifle from 'destiny-icons/weapons/scout_rifle.svg';
import shotgun from 'destiny-icons/weapons/shotgun.svg';
import sidearm from 'destiny-icons/weapons/sidearm.svg';
import smg from 'destiny-icons/weapons/smg.svg';
import sniperRifle from 'destiny-icons/weapons/sniper_rifle.svg';
import sword from 'destiny-icons/weapons/sword_heavy.svg';
import lFusionRifle from 'destiny-icons/weapons/wire_rifle.svg';
import _ from 'lodash';
import React from 'react';
import legs from '../../../destiny-icons/armor_types/boots.svg';
import chest from '../../../destiny-icons/armor_types/chest.svg';
import classItem from '../../../destiny-icons/armor_types/class.svg';
import gauntlets from '../../../destiny-icons/armor_types/gloves.svg';
import helmet from '../../../destiny-icons/armor_types/helmet.svg';
import hunter from '../../../destiny-icons/general/class_hunter.svg';
import titan from '../../../destiny-icons/general/class_titan.svg';
import warlock from '../../../destiny-icons/general/class_warlock.svg';
import styles from './ItemTypeSelector.m.scss';

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
  [ItemCategoryHashes.Helmets]: helmet,
  [ItemCategoryHashes.Arms]: gauntlets,
  [ItemCategoryHashes.Chest]: chest,
  [ItemCategoryHashes.Legs]: legs,
  [ItemCategoryHashes.ClassItems]: classItem,
};

/**
 * Generate a tree of all the drilldown options for item filtering. This tree is
 * used to generate the list of selected subcategories.
 */
const getD2SelectionTree = (defs: D2ManifestDefinitions): ItemCategoryTreeNode => {
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
    itemCategoryHash: ItemCategoryHashes.KineticWeapon,
    terminal: true,
    icon: dmgKinetic,
  };
  const energy: ItemCategoryTreeNode = {
    id: 'energy',
    itemCategoryHash: ItemCategoryHashes.EnergyWeapon,
    terminal: true,
    icon: energyWeapon,
  };
  const power: ItemCategoryTreeNode = {
    id: 'power',
    itemCategoryHash: ItemCategoryHashes.PowerWeapon,
    terminal: true,
    icon: powerWeapon,
  };

  return {
    id: 'all',
    itemCategoryHash: 0,
    subCategories: [
      {
        id: 'weapons',
        itemCategoryHash: ItemCategoryHashes.Weapon,
        icon: handCannon,
        subCategories: [
          {
            id: 'autorifle',
            itemCategoryHash: ItemCategoryHashes.AutoRifle,
            subCategories: [kinetic, energy],
            terminal: true,
            icon: autoRifle,
          },
          {
            id: 'handcannon',
            itemCategoryHash: ItemCategoryHashes.HandCannon,
            subCategories: [kinetic, energy],
            terminal: true,
            icon: handCannon,
          },
          {
            id: 'pulserifle',
            itemCategoryHash: ItemCategoryHashes.PulseRifle,
            subCategories: [kinetic, energy],
            terminal: true,
            icon: pulseRifle,
          },
          {
            id: 'scoutrifle',
            itemCategoryHash: ItemCategoryHashes.ScoutRifle,
            subCategories: [kinetic, energy],
            terminal: true,
            icon: scoutRifle,
          },
          {
            id: 'sidearm',
            itemCategoryHash: ItemCategoryHashes.Sidearm,
            subCategories: [kinetic, energy],
            terminal: true,
            icon: sidearm,
          },
          {
            id: 'bow',
            itemCategoryHash: ItemCategoryHashes.Bows,
            subCategories: [kinetic, energy, power],
            terminal: true,
            icon: bow,
          },
          {
            id: 'submachine',
            itemCategoryHash: ItemCategoryHashes.SubmachineGuns,
            subCategories: [kinetic, energy],
            terminal: true,
            icon: smg,
          },
          {
            id: 'fusionrifle',
            itemCategoryHash: ItemCategoryHashes.FusionRifle,
            subCategories: [energy, power],
            terminal: true,
            icon: fusionRifle,
          },
          {
            id: 'sniperrifle',
            itemCategoryHash: ItemCategoryHashes.SniperRifle,
            subCategories: [kinetic, energy, power],
            terminal: true,
            icon: sniperRifle,
          },
          {
            id: 'shotgun',
            itemCategoryHash: ItemCategoryHashes.Shotgun,
            subCategories: [kinetic, energy, power],
            terminal: true,
            icon: shotgun,
          },
          {
            id: 'tracerifle',
            itemCategoryHash: ItemCategoryHashes.TraceRifles,
            subCategories: [kinetic, energy],
            terminal: true,
            icon: traceRifle,
          },
          {
            id: 'machinegun',
            itemCategoryHash: ItemCategoryHashes.MachineGun,
            terminal: true,
            icon: machinegun,
          },
          {
            id: 'sword',
            itemCategoryHash: ItemCategoryHashes.Sword,
            terminal: true,
            icon: sword,
          },
          {
            id: 'grenadelauncher',
            itemCategoryHash: ItemCategoryHashes.GrenadeLaunchers,
            subCategories: [kinetic, energy, power],
            terminal: true,
            icon: gLauncher,
          },
          {
            id: 'rocketlauncher',
            itemCategoryHash: ItemCategoryHashes.RocketLauncher,
            terminal: true,
            icon: rLauncher,
          },
          {
            id: 'linearfusionrifle',
            itemCategoryHash: ItemCategoryHashes.LinearFusionRifles,
            subCategories: [kinetic, power],
            terminal: true,
            icon: lFusionRifle,
          },
        ],
      },
      {
        id: 'hunter',
        itemCategoryHash: ItemCategoryHashes.Hunter,
        subCategories: armorCategories,
        icon: hunter,
      },
      {
        id: 'titan',
        itemCategoryHash: ItemCategoryHashes.Titan,
        subCategories: armorCategories,
        icon: titan,
      },
      {
        id: 'warlock',
        itemCategoryHash: ItemCategoryHashes.Warlock,
        subCategories: armorCategories,
        icon: warlock,
      },
      {
        id: 'ghosts',
        itemCategoryHash: ItemCategoryHashes.Ghost,
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
const getD1SelectionTree = (): ItemCategoryTreeNode => {
  // Each class has the same armor
  const armorCategories = [
    {
      id: 'helmets',
      itemCategoryHash: ItemCategoryHashes.Helmets,
      terminal: true,
      icon: helmet,
    },
    {
      id: 'gauntlets',
      itemCategoryHash: ItemCategoryHashes.Arms,
      terminal: true,
      icon: gauntlets,
    },
    {
      id: 'chests',
      itemCategoryHash: ItemCategoryHashes.Chest,
      terminal: true,
      icon: chest,
    },
    {
      id: 'legs',
      itemCategoryHash: ItemCategoryHashes.Legs,
      terminal: true,
      icon: legs,
    },
    {
      id: 'classItems',
      itemCategoryHash: ItemCategoryHashes.ClassItems,
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
        itemCategoryHash: ItemCategoryHashes.Weapon,
        icon: handCannon,
        subCategories: [
          {
            id: 'autorifle',
            itemCategoryHash: ItemCategoryHashes.AutoRifle,
            terminal: true,
            icon: autoRifle,
          },
          {
            id: 'handcannon',
            itemCategoryHash: ItemCategoryHashes.HandCannon,
            terminal: true,
            icon: handCannon,
          },
          {
            id: 'pulserifle',
            itemCategoryHash: ItemCategoryHashes.PulseRifle,
            terminal: true,
            icon: pulseRifle,
          },
          {
            id: 'scoutrifle',
            itemCategoryHash: ItemCategoryHashes.ScoutRifle,
            terminal: true,
            icon: scoutRifle,
          },
          {
            id: 'fusionrifle',
            itemCategoryHash: ItemCategoryHashes.FusionRifle,
            terminal: true,
            icon: fusionRifle,
          },
          {
            id: 'sniperrifle',
            itemCategoryHash: ItemCategoryHashes.SniperRifle,
            terminal: true,
            icon: sniperRifle,
          },
          {
            id: 'shotgun',
            itemCategoryHash: ItemCategoryHashes.Shotgun,
            terminal: true,
            icon: shotgun,
          },
          {
            id: 'machinegun',
            itemCategoryHash: ItemCategoryHashes.MachineGun,
            terminal: true,
            icon: machinegun,
          },
          {
            id: 'rocketlauncher',
            itemCategoryHash: ItemCategoryHashes.RocketLauncher,
            terminal: true,
            icon: rLauncher,
          },
          {
            id: 'sidearm',
            itemCategoryHash: ItemCategoryHashes.Sidearm,
            terminal: true,
            icon: sidearm,
          },
          {
            id: 'sword',
            itemCategoryHash: ItemCategoryHashes.Sword,
            terminal: true,
            icon: sword,
          },
        ],
      },
      {
        id: 'armor',
        itemCategoryHash: ItemCategoryHashes.Armor,
        icon: helmet,
        subCategories: [
          {
            id: 'hunter',
            itemCategoryHash: ItemCategoryHashes.Hunter,
            subCategories: armorCategories,
            icon: hunter,
          },
          {
            id: 'titan',
            itemCategoryHash: ItemCategoryHashes.Titan,
            subCategories: armorCategories,
            icon: titan,
          },
          {
            id: 'warlock',
            itemCategoryHash: ItemCategoryHashes.Warlock,
            subCategories: armorCategories,
            icon: warlock,
          },
        ],
      },
      {
        id: 'ghosts',
        itemCategoryHash: ItemCategoryHashes.Ghost,
        icon: ghost,
        terminal: true,
      },
    ],
  };
};

export function getSelectionTree(defs: D2ManifestDefinitions | D1ManifestDefinitions) {
  return defs.isDestiny2() ? getD2SelectionTree(defs) : getD1SelectionTree();
}

/**
 * This component offers a means for narrowing down your selection to a single item type
 * (hunter helmets, hand cannons, etc.) for the Organizer table.
 */
export default function ItemTypeSelector({
  defs,
  selectionTree,
  selection,
  onSelection,
}: {
  defs: D2ManifestDefinitions | D1ManifestDefinitions;
  selectionTree: ItemCategoryTreeNode;
  selection: ItemCategoryTreeNode[];
  onSelection(selection: ItemCategoryTreeNode[]): void;
}) {
  selection = selection.length ? selection : [selectionTree];

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
