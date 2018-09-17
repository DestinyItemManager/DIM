import { copy } from 'angular';
import * as _ from 'underscore';
import { sum } from '../util';
import { Loadout } from './loadout.service';
import { DimItem } from '../inventory/item-types';

// Generate an optimized loadout based on a filtered set of items and a value function
export function optimalLoadout(
  applicableItems: DimItem[],
  bestItemFn: (item: DimItem) => number,
  name: string
): Loadout {
  const itemsByType = _.groupBy(applicableItems, 'type');

  // Pick the best item
  let items = _.mapObject(itemsByType, (items) => _.max(items, bestItemFn));

  // Solve for the case where our optimizer decided to equip two exotics
  const getLabel = (i) => i.equippingLabel;
  // All items that share an equipping label, grouped by label
  const overlaps: _.Dictionary<DimItem[]> = _.groupBy(
    Object.values(items).filter(getLabel),
    getLabel
  );
  _.each(overlaps, (overlappingItems) => {
    if (overlappingItems.length <= 1) {
      return;
    }

    const options: _.Dictionary<DimItem>[] = [];
    // For each item, replace all the others overlapping it with the next best thing
    for (const item of overlappingItems) {
      const option = copy(items);
      const otherItems = overlappingItems.filter((i) => i !== item);
      let optionValid = true;

      for (const otherItem of otherItems) {
        // Note: we could look for items that just don't have the *same* equippingLabel but
        // that may fail if there are ever mutual-exclusion items beyond exotics.
        const nonExotics = itemsByType[otherItem.type].filter((i) => !i.equippingLabel);
        if (nonExotics.length) {
          option[otherItem.type] = _.max(nonExotics, bestItemFn);
        } else {
          // this option isn't usable because we couldn't swap this exotic for any non-exotic
          optionValid = false;
        }
      }

      if (optionValid) {
        options.push(option);
      }
    }

    // Pick the option where the optimizer function adds up to the biggest number, again favoring equipped stuff
    if (options.length > 0) {
      const bestOption = _.max(options, (opt) => sum(Object.values(opt), bestItemFn));
      items = bestOption;
    }
  });

  // Copy the items and mark them equipped and put them in arrays, so they look like a loadout
  const finalItems: { [type: string]: DimItem[] } = {};
  _.each(items, (item, type) => {
    const itemCopy = copy(item);
    itemCopy.equipped = true;
    finalItems[type.toLowerCase()] = [itemCopy];
  });

  return {
    classType: -1,
    name,
    items: finalItems
  };
}
