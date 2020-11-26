import { D1ManifestDefinitions } from 'app/destiny1/d1-definitions';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { filteredItemsSelector } from 'app/search/search-filter';
import clsx from 'clsx';
import { ItemCategoryHashes } from 'data/d2/generated-enums';
import _ from 'lodash';
import React from 'react';
import { useSelector } from 'react-redux';
import { itemIncludesCategories } from './filtering-utils';
import { itemCategoryIcons } from './item-category-icons';
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
}

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
      };
    }
  );

  // Each weapon type may be in several subcategories
  const kinetic: ItemCategoryTreeNode = {
    id: 'kinetic',
    itemCategoryHash: ItemCategoryHashes.KineticWeapon,
    terminal: true,
  };
  const energy: ItemCategoryTreeNode = {
    id: 'energy',
    itemCategoryHash: ItemCategoryHashes.EnergyWeapon,
    terminal: true,
  };
  const power: ItemCategoryTreeNode = {
    id: 'power',
    itemCategoryHash: ItemCategoryHashes.PowerWeapon,
    terminal: true,
  };

  return {
    id: 'all',
    itemCategoryHash: 0,
    subCategories: [
      {
        id: 'weapons',
        itemCategoryHash: ItemCategoryHashes.Weapon,

        subCategories: [
          {
            id: 'autorifle',
            itemCategoryHash: ItemCategoryHashes.AutoRifle,
            subCategories: [kinetic, energy],
            terminal: true,
          },
          {
            id: 'handcannon',
            itemCategoryHash: ItemCategoryHashes.HandCannon,
            subCategories: [kinetic, energy],
            terminal: true,
          },
          {
            id: 'pulserifle',
            itemCategoryHash: ItemCategoryHashes.PulseRifle,
            subCategories: [kinetic, energy],
            terminal: true,
          },
          {
            id: 'scoutrifle',
            itemCategoryHash: ItemCategoryHashes.ScoutRifle,
            subCategories: [kinetic, energy],
            terminal: true,
          },
          {
            id: 'sidearm',
            itemCategoryHash: ItemCategoryHashes.Sidearm,
            subCategories: [kinetic, energy],
            terminal: true,
          },
          {
            id: 'bow',
            itemCategoryHash: ItemCategoryHashes.Bows,
            subCategories: [kinetic, energy, power],
            terminal: true,
          },
          {
            id: 'submachine',
            itemCategoryHash: ItemCategoryHashes.SubmachineGuns,
            subCategories: [kinetic, energy],
            terminal: true,
          },
          {
            id: 'fusionrifle',
            itemCategoryHash: ItemCategoryHashes.FusionRifle,
            subCategories: [energy, power],
            terminal: true,
          },
          {
            id: 'sniperrifle',
            itemCategoryHash: ItemCategoryHashes.SniperRifle,
            subCategories: [kinetic, energy, power],
            terminal: true,
          },
          {
            id: 'shotgun',
            itemCategoryHash: ItemCategoryHashes.Shotgun,
            subCategories: [kinetic, energy, power],
            terminal: true,
          },
          {
            id: 'tracerifle',
            itemCategoryHash: ItemCategoryHashes.TraceRifles,
            subCategories: [kinetic, energy],
            terminal: true,
          },
          {
            id: 'machinegun',
            itemCategoryHash: ItemCategoryHashes.MachineGun,
            terminal: true,
          },
          {
            id: 'sword',
            itemCategoryHash: ItemCategoryHashes.Sword,
            terminal: true,
          },
          {
            id: 'grenadelauncher',
            itemCategoryHash: ItemCategoryHashes.GrenadeLaunchers,
            subCategories: [kinetic, energy, power],
            terminal: true,
          },
          {
            id: 'rocketlauncher',
            itemCategoryHash: ItemCategoryHashes.RocketLauncher,
            terminal: true,
          },
          {
            id: 'linearfusionrifle',
            itemCategoryHash: ItemCategoryHashes.LinearFusionRifles,
            subCategories: [kinetic, power],
            terminal: true,
          },
        ],
      },
      {
        id: 'hunter',
        itemCategoryHash: ItemCategoryHashes.Hunter,
        subCategories: armorCategories,
      },
      {
        id: 'titan',
        itemCategoryHash: ItemCategoryHashes.Titan,
        subCategories: armorCategories,
      },
      {
        id: 'warlock',
        itemCategoryHash: ItemCategoryHashes.Warlock,
        subCategories: armorCategories,
      },
      {
        id: 'ghosts',
        itemCategoryHash: ItemCategoryHashes.Ghost,

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
    },
    {
      id: 'gauntlets',
      itemCategoryHash: ItemCategoryHashes.Arms,
      terminal: true,
    },
    {
      id: 'chests',
      itemCategoryHash: ItemCategoryHashes.Chest,
      terminal: true,
    },
    {
      id: 'legs',
      itemCategoryHash: ItemCategoryHashes.Legs,
      terminal: true,
    },
    {
      id: 'classItems',
      itemCategoryHash: ItemCategoryHashes.ClassItems,
      terminal: true,
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

        subCategories: [
          {
            id: 'autorifle',
            itemCategoryHash: ItemCategoryHashes.AutoRifle,
            terminal: true,
          },
          {
            id: 'handcannon',
            itemCategoryHash: ItemCategoryHashes.HandCannon,
            terminal: true,
          },
          {
            id: 'pulserifle',
            itemCategoryHash: ItemCategoryHashes.PulseRifle,
            terminal: true,
          },
          {
            id: 'scoutrifle',
            itemCategoryHash: ItemCategoryHashes.ScoutRifle,
            terminal: true,
          },
          {
            id: 'fusionrifle',
            itemCategoryHash: ItemCategoryHashes.FusionRifle,
            terminal: true,
          },
          {
            id: 'sniperrifle',
            itemCategoryHash: ItemCategoryHashes.SniperRifle,
            terminal: true,
          },
          {
            id: 'shotgun',
            itemCategoryHash: ItemCategoryHashes.Shotgun,
            terminal: true,
          },
          {
            id: 'machinegun',
            itemCategoryHash: ItemCategoryHashes.MachineGun,
            terminal: true,
          },
          {
            id: 'rocketlauncher',
            itemCategoryHash: ItemCategoryHashes.RocketLauncher,
            terminal: true,
          },
          {
            id: 'sidearm',
            itemCategoryHash: ItemCategoryHashes.Sidearm,
            terminal: true,
          },
          {
            id: 'sword',
            itemCategoryHash: ItemCategoryHashes.Sword,
            terminal: true,
          },
        ],
      },
      {
        id: 'armor',
        itemCategoryHash: ItemCategoryHashes.Armor,

        subCategories: [
          {
            id: 'hunter',
            itemCategoryHash: ItemCategoryHashes.Hunter,
            subCategories: armorCategories,
          },
          {
            id: 'titan',
            itemCategoryHash: ItemCategoryHashes.Titan,
            subCategories: armorCategories,
          },
          {
            id: 'warlock',
            itemCategoryHash: ItemCategoryHashes.Warlock,
            subCategories: armorCategories,
          },
        ],
      },
      {
        id: 'ghosts',
        itemCategoryHash: ItemCategoryHashes.Ghost,

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
  const filteredItems = useSelector(filteredItemsSelector);
  selection = selection.length ? selection : [selectionTree];

  const handleSelection = (depth: number, subCategory: ItemCategoryTreeNode) =>
    onSelection([..._.take(selection, depth + 1), subCategory]);

  return (
    <div className={styles.selector}>
      {selection.map((currentSelection, depth) => {
        const upstreamCategories: number[] = [];
        for (let i = 1; i < depth + 1; i++) {
          selection[i].itemCategoryHash && upstreamCategories.push(selection[i].itemCategoryHash);
        }
        return (
          currentSelection.subCategories && (
            <div key={depth} className={styles.level}>
              {currentSelection.subCategories?.map((subCategory) => {
                const categoryHashList = [...upstreamCategories, subCategory.itemCategoryHash];
                return (
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
                    {itemCategoryIcons[subCategory.itemCategoryHash] && (
                      <img src={itemCategoryIcons[subCategory.itemCategoryHash]} />
                    )}
                    {defs.ItemCategory.get(subCategory.itemCategoryHash).displayProperties?.name ||
                      defs.ItemCategory.get(subCategory.itemCategoryHash).title}{' '}
                    <span className={styles.buttonItemCount}>
                      (
                      {
                        filteredItems.filter(
                          (i) => i.comparable && itemIncludesCategories(i, categoryHashList)
                        ).length
                      }
                      )
                    </span>
                  </label>
                );
              })}
            </div>
          )
        );
      })}
    </div>
  );
}
