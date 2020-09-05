import { tl } from 'app/i18next-t';
import { DimItem } from 'app/inventory/item-types';
import { DimStore } from 'app/inventory/store-types';
import { getStore } from 'app/inventory/stores-helpers';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import { FilterDefinition } from '../filter-types';

const stores: DimStore[] = [];
const currentStore: DimStore = {} as DimStore;

// filters that check stores
const locationFilters: FilterDefinition[] = [
  {
    keywords: ['inleftchar', 'inmiddlechar', 'inrightchar'],
    description: [tl('Filter.Location')],
    format: 'simple',
    destinyVersion: 0,
    filterFunction: (item: DimItem, filterValue: string) => {
      let storeIndex = 0;

      switch (filterValue) {
        case 'inleftchar':
          storeIndex = 0;
          break;
        case 'inmiddlechar':
          if (stores.length === 4) {
            storeIndex = 1;
          }
          break;
        case 'inrightchar':
          if (stores.length > 2) {
            storeIndex = stores.length - 2;
          }
          break;
        default:
          return false;
      }

      return item.bucket.accountWide && !item.location.inPostmaster
        ? item.owner !== 'vault'
        : item.owner === stores[storeIndex].id;
    },
  },
  {
    keywords: ['onwrongclass'],
    description: [tl('Filter.Class')],
    format: 'simple',
    destinyVersion: 0,
    filterFunction: (item: DimItem) => {
      const ownerStore = getStore(stores, item.owner);

      return (
        !item.classified &&
        item.owner !== 'vault' &&
        !item.bucket.accountWide &&
        item.classType !== DestinyClass.Unknown &&
        ownerStore &&
        !item.canBeEquippedBy(ownerStore) &&
        !item.location?.inPostmaster
      );
    },
  },
  {
    keywords: ['invault', 'incurrentchar'],
    description: [tl('Filter.Location')],
    format: 'query',
    destinyVersion: 0,
    filterFunction: (item: DimItem, filterValue: string) => {
      let desiredStore = '';
      switch (filterValue) {
        case 'invault':
          desiredStore = 'vault';
          break;
        case 'incurrentchar': {
          if (currentStore) {
            desiredStore = currentStore.id;
          } else {
            return false;
          }
        }
      }
      return item.owner === desiredStore;
    },
  },
];

export default locationFilters;
