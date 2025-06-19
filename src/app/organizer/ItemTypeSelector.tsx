import { DestinyVersion } from '@destinyitemmanager/dim-api-types';
import BucketIcon from 'app/dim-ui/svgs/BucketIcon';
import { useDefinitions } from 'app/manifest/selectors';
import { filteredItemsSelector } from 'app/search/items/item-search-filter';
import { count } from 'app/utils/collections';
import clsx from 'clsx';
import { ItemCategoryHashes } from 'data/d2/generated-enums';
import { useSelector } from 'react-redux';
import styles from './ItemTypeSelector.m.scss';

/**
 * Each branch of the drilldown options is represented by a SelectionTreeNode
 * which tells which item category to filter with, as well as what sub-categories
 * can still be drilled down into.
 */
export interface ItemCategoryTreeNode {
  id: string;
  itemCategoryHash: ItemCategoryHashes | 0;
  subCategories?: ItemCategoryTreeNode[];
  /** A terminal node can have items displayed for it. It may still have other drilldowns available. */
  terminal?: boolean;
}

// Each class has the same armor
const armorCategories = [
  {
    id: 'helmet',
    itemCategoryHash: ItemCategoryHashes.Helmets,
    terminal: true,
  },
  {
    id: 'arms',
    itemCategoryHash: ItemCategoryHashes.Arms,
    terminal: true,
  },
  {
    id: 'chest',
    itemCategoryHash: ItemCategoryHashes.Chest,
    terminal: true,
  },
  {
    id: 'legs',
    itemCategoryHash: ItemCategoryHashes.Legs,
    terminal: true,
  },
  {
    id: 'classItem',
    itemCategoryHash: ItemCategoryHashes.ClassItems,
    terminal: true,
  },
];

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

/**
 * Generate a tree of all the drilldown options for item filtering. This tree is
 * used to generate the list of selected subcategories.
 */
const d2SelectionTree: ItemCategoryTreeNode = {
  id: 'all',
  itemCategoryHash: 0,
  subCategories: [
    {
      id: 'weapons',
      itemCategoryHash: ItemCategoryHashes.Weapon,
      terminal: true,

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
          subCategories: [kinetic, energy, power],
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
          id: 'specialgrenadelauncher',
          itemCategoryHash: -ItemCategoryHashes.GrenadeLaunchers,
          subCategories: [kinetic, energy],
          terminal: true,
        },
        {
          id: 'tracerifle',
          itemCategoryHash: ItemCategoryHashes.TraceRifles,
          subCategories: [kinetic, energy],
          terminal: true,
        },
        {
          id: 'glaive',
          itemCategoryHash: ItemCategoryHashes.Glaives,
          subCategories: [kinetic, energy, power],
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
          id: 'heavygrenadelauncher',
          itemCategoryHash: ItemCategoryHashes.GrenadeLaunchers,
          subCategories: [power],
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
          subCategories: [kinetic, energy, power],
          terminal: true,
        },
      ],
    },
    {
      id: 'hunter',
      itemCategoryHash: ItemCategoryHashes.Hunter,
      subCategories: armorCategories,
      terminal: true,
    },
    {
      id: 'titan',
      itemCategoryHash: ItemCategoryHashes.Titan,
      subCategories: armorCategories,
      terminal: true,
    },
    {
      id: 'warlock',
      itemCategoryHash: ItemCategoryHashes.Warlock,
      subCategories: armorCategories,
      terminal: true,
    },
    {
      id: 'ghosts',
      itemCategoryHash: ItemCategoryHashes.Ghost,
      terminal: true,
    },
  ],
};

// Each class has the same armor
const d1ArmorCategories = [
  ...armorCategories,
  {
    id: 'artifacts',
    itemCategoryHash: 38,
    terminal: true,
  },
];

/**
 * Generate a tree of all the drilldown options for item filtering. This tree is
 * used to generate the list of selected subcategories.
 */
const d1SelectionTree: ItemCategoryTreeNode = {
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
      id: 'hunter',
      itemCategoryHash: ItemCategoryHashes.Hunter,
      subCategories: d1ArmorCategories,
    },
    {
      id: 'titan',
      itemCategoryHash: ItemCategoryHashes.Titan,
      subCategories: d1ArmorCategories,
    },
    {
      id: 'warlock',
      itemCategoryHash: ItemCategoryHashes.Warlock,
      subCategories: d1ArmorCategories,
    },
    {
      id: 'ghosts',
      itemCategoryHash: ItemCategoryHashes.Ghost,

      terminal: true,
    },
  ],
};

export function getSelectionTree(destinyVersion: DestinyVersion) {
  return destinyVersion === 2 ? d2SelectionTree : d1SelectionTree;
}

export const armorTopLevelCatHashes: ItemCategoryHashes[] = [
  ItemCategoryHashes.Hunter,
  ItemCategoryHashes.Titan,
  ItemCategoryHashes.Warlock,
];

/**
 * This component offers a means for narrowing down your selection to a single item type
 * (hunter helmets, hand cannons, etc.) for the Organizer table.
 */
export default function ItemTypeSelector({
  selectionTree,
  selection,
  onSelection,
}: {
  selectionTree: ItemCategoryTreeNode;
  selection: ItemCategoryTreeNode[];
  onSelection: (selection: ItemCategoryTreeNode[]) => void;
}) {
  const defs = useDefinitions()!;
  const filteredItems = useSelector(filteredItemsSelector);
  selection = selection.length ? selection : [selectionTree];

  const handleSelection = (depth: number, subCategory: ItemCategoryTreeNode) =>
    onSelection([...selection.slice(0, depth + 1), subCategory]);

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

                // a top level class-specific category implies armor
                if (armorTopLevelCatHashes.some((h) => categoryHashList.includes(h))) {
                  categoryHashList.push(ItemCategoryHashes.Armor);
                }

                const itemCategory = defs.ItemCategory.get(Math.abs(subCategory.itemCategoryHash));
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
                    {subCategory.itemCategoryHash !== 0 && (
                      <BucketIcon itemCategoryHash={subCategory.itemCategoryHash} />
                    )}
                    {'displayProperties' in itemCategory
                      ? itemCategory.displayProperties.name
                      : itemCategory.title}{' '}
                    <span className={styles.buttonItemCount}>
                      (
                      {count(
                        filteredItems,
                        (i) =>
                          i.comparable &&
                          categoryHashList.every((h) => i.itemCategoryHashes.includes(h)),
                      )}
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
