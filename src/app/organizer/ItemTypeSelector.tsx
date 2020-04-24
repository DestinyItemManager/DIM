import React from 'react';
import memoizeOne from 'memoize-one';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import _ from 'lodash';
import styles from './ItemTypeSelector.m.scss';
import clsx from 'clsx';

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
// TODO: save to URL params
export const getSelectionTree = memoizeOne(
  (defs: D2ManifestDefinitions): ItemCategoryTreeNode => {
    const armorCategory = defs.ItemCategory.get(20);

    // Each class has the same armor
    const armorCategories = armorCategory.groupedCategoryHashes.map(
      (categoryHash): ItemCategoryTreeNode => {
        const category = defs.ItemCategory.get(categoryHash);
        return {
          id: category.originBucketIdentifier,
          itemCategoryHash: categoryHash,
          terminal: true
        };
      }
    );
    // TODO: should we offer arc/solar/void drilldowns here, or with buttons?

    // Each weapon type may be in several subcategories
    const kinetic = {
      id: 'kinetic',
      itemCategoryHash: 2,
      terminal: true
    };
    const energy = {
      id: 'energy',
      itemCategoryHash: 3,
      terminal: true
    };
    const power = {
      id: 'power',
      itemCategoryHash: 4,
      terminal: true
    };

    // TODO: I suppose weapons could have archetype subselection
    // TODO: It'd be great to generate these
    return {
      id: 'all',
      itemCategoryHash: 0,
      subCategories: [
        {
          id: 'weapons',
          itemCategoryHash: 1,
          subCategories: [
            {
              id: 'autorifle',
              itemCategoryHash: 5,
              subCategories: [kinetic, energy],
              terminal: true
            },
            {
              id: 'handcannon',
              itemCategoryHash: 6,
              subCategories: [kinetic, energy],
              terminal: true
            },
            {
              id: 'pulserifle',
              itemCategoryHash: 7,
              subCategories: [kinetic, energy],
              terminal: true
            },
            {
              id: 'scoutrifle',
              itemCategoryHash: 8,
              subCategories: [kinetic, energy],
              terminal: true
            },
            {
              id: 'fusionrifle',
              itemCategoryHash: 9,
              subCategories: [energy, power],
              terminal: true
            },
            {
              id: 'sniperrifle',
              itemCategoryHash: 10,
              subCategories: [kinetic, energy, power],
              terminal: true
            },
            {
              id: 'shotgun',
              itemCategoryHash: 11,
              subCategories: [kinetic, energy, power],
              terminal: true
            },
            {
              id: 'machinegun',
              itemCategoryHash: 12,
              terminal: true
            },
            {
              id: 'rocketlauncher',
              itemCategoryHash: 13,
              terminal: true
            },
            {
              id: 'sidearm',
              itemCategoryHash: 14,
              subCategories: [kinetic, energy],
              terminal: true
            },
            {
              id: 'sword',
              itemCategoryHash: 54,
              terminal: true
            },
            {
              id: 'grenadelauncher',
              itemCategoryHash: 153950757,
              subCategories: [kinetic, energy, power],
              terminal: true
            },
            {
              id: 'tracerifle',
              itemCategoryHash: 2489664120,
              subCategories: [kinetic, energy],
              terminal: true
            },
            {
              id: 'linearfusionrifle',
              itemCategoryHash: 1504945536,
              subCategories: [kinetic, power],
              terminal: true
            },
            {
              id: 'submachine',
              itemCategoryHash: 3954685534,
              subCategories: [kinetic, energy],
              terminal: true
            },
            {
              id: 'bow',
              itemCategoryHash: 3317538576,
              subCategories: [kinetic, energy, power],
              terminal: true
            }
          ]
        },
        {
          id: 'armor',
          itemCategoryHash: 20,
          subCategories: [
            {
              id: 'hunter',
              itemCategoryHash: 23,
              subCategories: armorCategories
            },
            {
              id: 'titan',
              itemCategoryHash: 22,
              subCategories: armorCategories
            },
            {
              id: 'warlock',
              itemCategoryHash: 21,
              subCategories: armorCategories
            }
          ]
        }
      ]
    };
  }
);

/**
 * This component offers a means for narrowing down your selection to a single item type
 * (hunter helmets, hand cannons, etc.) for the Organizer table.
 */
export default function ItemTypeSelector({
  defs,
  selection,
  onSelection
}: {
  defs: D2ManifestDefinitions;
  selection: ItemCategoryTreeNode[];
  onSelection(selection: ItemCategoryTreeNode[]): void;
}) {
  selection = selection.length ? selection : [getSelectionTree(defs)];

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
                    [styles.checked]: selection[depth + 1] === subCategory
                  })}
                >
                  <input
                    type="radio"
                    name={subCategory.id}
                    value={subCategory.id}
                    checked={selection[depth + 1] === subCategory}
                    readOnly={true}
                    onClick={(_e) => handleSelection(depth, subCategory)}
                  />{' '}
                  {defs.ItemCategory.get(subCategory.itemCategoryHash).displayProperties.name}
                </label>
              ))}
            </div>
          )
      )}
    </div>
  );
}
