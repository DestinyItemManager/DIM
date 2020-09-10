import { tl } from 'app/i18next-t';
import { getStore } from 'app/inventory/stores-helpers';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import _ from 'lodash';
import { FilterDefinition } from '../filter-types';

// filters that check stores
const locationFilters: FilterDefinition[] = [
  {
    keywords: ['inleftchar', 'inmiddlechar', 'inrightchar'],
    description: tl('Filter.Location'),
    filterFunction: ({ filterValue, stores }) => {
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
          return _.stubFalse;
      }

      const storeId = stores[storeIndex].id;

      return (item) =>
        item.bucket.accountWide && !item.location.inPostmaster
          ? item.owner !== 'vault'
          : item.owner === storeId;
    },
  },
  {
    keywords: 'onwrongclass',
    description: tl('Filter.Class'),
    filterFunction: ({ stores }) => (item) => {
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
    keywords: 'invault',
    description: tl('Filter.Location'),
    filterFunction: () => (item) => item.owner === 'vault',
  },
  {
    keywords: 'incurrentchar',
    description: tl('Filter.Location'),
    filterFunction: ({ currentStore }) => (item) =>
      currentStore ? item.owner === currentStore.id : false,
  },
];

export default locationFilters;
