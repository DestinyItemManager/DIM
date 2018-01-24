import * as angular from 'angular';
import * as _ from 'underscore';
import { sum } from '../util';
import { Loadout } from './loadout.service';
import { DimStore } from '../inventory/store/d2-store-factory.service';
import { DimItem } from '../inventory/store/d2-item-factory.service';

// Generate an optimized loadout based on a filtered set of items and a value function
export function optimalLoadout(store: DimStore, applicableItems: DimItem[], bestItemFn: (DimItem) => number, name: string): Loadout {
  const itemsByType = _.groupBy(applicableItems, 'type');

  const isExotic = (item) => {
    return item.isExotic && !item.hasLifeExotic();
  };

  // Pick the best item
  const items: _.Dictionary<DimItem> = _.mapObject(itemsByType, (items) => {
    return _.max(items, bestItemFn);
  });

  // Solve for the case where our optimizer decided to equip two exotics
  // TODO: D2 gives us a way better way to do this with equippingBlock info, but it's too complex to figure out now
  const exoticGroups = store.destinyVersion === 1
    ? [['Primary', 'Special', 'Heavy'], ['Helmet', 'Gauntlets', 'Chest', 'Leg']]
    : [['Kinetic', 'Energy', 'Power'], ['Helmet', 'Gauntlets', 'Chest', 'Leg']];
  _.each(exoticGroups, (group) => {
    const itemsInGroup: _.Dictionary<DimItem> = _.pick(items, group);
    const numExotics = _.filter(_.values(itemsInGroup), isExotic).length;
    if (numExotics > 1) {
      const options: _.Dictionary<DimItem>[] = [];

      // Generate an option where we use each exotic
      _.each(itemsInGroup, (item, type) => {
        if (isExotic(item)) {
          const option = angular.copy(itemsInGroup);
          let optionValid = true;
          // Switch the other exotic items to the next best non-exotic
          _.each(_.omit(itemsInGroup, type), (otherItem, otherType) => {
            if (isExotic(otherItem)) {
              const nonExotics = _.reject(itemsByType[otherType], isExotic);
              if (_.isEmpty(nonExotics)) {
                // this option isn't usable because we couldn't swap this exotic for any non-exotic
                optionValid = false;
              } else {
                option[otherType] = _.max(nonExotics, bestItemFn);
              }
            }
          });

          if (optionValid) {
            options.push(option);
          }
        }
      });

      // Pick the option where the optimizer function adds up to the biggest number, again favoring equipped stuff
      const bestOption = _.max(options, (opt) => sum(_.values(opt), bestItemFn));
      _.assign(items, bestOption);
    }
  });

  // Copy the items and mark them equipped and put them in arrays, so they look like a loadout
  const finalItems: { [type: string]: DimItem[] } = {};
  _.each(items, (item, type) => {
    const itemCopy = angular.copy(item);
    itemCopy.equipped = true;
    finalItems[type.toLowerCase()] = [itemCopy];
  });

  return {
    classType: -1,
    name,
    items: finalItems
  };
}
