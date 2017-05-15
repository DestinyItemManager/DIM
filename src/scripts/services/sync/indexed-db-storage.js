import idbKeyval from 'idb-keyval';

export function IndexedDBStorage() {
  'ngInject';

  return {
    get: function() {
      return idbKeyval.get('DIM-data');
    },

    set: function(value) {
      return idbKeyval.set('DIM-data', value);
    },

    enabled: true,
    name: 'IndexedDBStorage'
  };
}
