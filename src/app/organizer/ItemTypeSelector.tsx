import React, { useState } from 'react';
import memoizeOne from 'memoize-one';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import _ from 'lodash';

interface SelectionTreeNode {
  id: string;
  itemCategoryHash: number;
  subCategories?: SelectionTreeNode[];
  terminal?: boolean;
  // TODO: expand category?
}

const getSelectionTree = memoizeOne(
  (defs: D2ManifestDefinitions): SelectionTreeNode => {
    const armorCategory = defs.ItemCategory.get(20);

    // Each class has the same armor
    const armorCategories = armorCategory.groupedCategoryHashes.map(
      (categoryHash): SelectionTreeNode => {
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
              subCategories: [power],
              terminal: true
            },
            {
              id: 'rocketlauncher',
              itemCategoryHash: 13,
              subCategories: [power],
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
              subCategories: [kinetic, energy],
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

/*
// TODO: can I resolve to item category??
const selectionTree: SelectionTreeNode =

{
  weapons: {

  },
  armor: {
    hunter: {
      category: 23,
      subcategories: {
        helmets: 45
      }
    },
    titan: {},
    warlock: {}
  }
}
*/

/**
 * This component offers a means for narrowing down your selection to a single item type
 * (hunter helmets, hand cannons, etc.) for the Organizer table.
 */
// TODO: how to make this a controlled component?
export default function ItemTypeSelector({
  defs,
  onSelection
}: {
  defs: D2ManifestDefinitions;
  onSelection(): void;
}) {
  const selectionTree = getSelectionTree(defs);

  // TODO: move state out of this?
  const [selection, setSelection] = useState<SelectionTreeNode[]>([selectionTree]);

  const handleSelection = (depth: number, subCategory: SelectionTreeNode) => {
    setSelection((selection) => {
      console.log({
        selection,
        depth,
        subCategory,
        newSelection: [..._.take(selection, depth + 1), subCategory]
      });
      return [..._.take(selection, depth + 1), subCategory];
    });
    onSelection();
  };

  return (
    <div>
      {selection.map((currentSelection, depth) => (
        <div key={depth}>
          {currentSelection.subCategories?.map((subCategory) => {
            console.log({
              id: subCategory.id,
              subCategory,
              atDepth: selection[depth + 1],
              equal: selection[depth + 1] === subCategory,
              selection
            });
            return (
              <label key={subCategory.itemCategoryHash}>
                <input
                  type="radio"
                  name={subCategory.id}
                  value={subCategory.id}
                  checked={selection[depth + 1] === subCategory}
                  onChange={(e) => e.target.checked && handleSelection(depth, subCategory)}
                />{' '}
                {defs.ItemCategory.get(subCategory.itemCategoryHash).displayProperties.name}
              </label>
            );
          })}
        </div>
      ))}
    </div>
  );
}

/*
// Suppose I could do this recursively, too
function getSelection(selectionTree: SelectionTreeNode[], selection: number[], depth: number) {
  let result: SelectionTreeNode | undefined;
  let index = 0;
  for (const selected of selection) {
    if (!result) {
      result = selectionTree[selected];
    } else if (result.subCategories) {
      result = result.subCategories[selected];
    } else {
      throw new Error('Ran out of subcategories');
    }
    if (index > depth) {
      break;
    }
    index++;
  }
  return result;
}
*/
