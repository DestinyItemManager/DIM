export function LocalStorage($q) {
  'ngInject';

  return {
    get: function() {
      return $q.resolve(JSON.parse(localStorage.getItem('DIM')));
    },

    set: function(value) {
      // TODO: remove in favor of IndexedDB
      localStorage.setItem('DIM', JSON.stringify(value));
      return $q.resolve(value);
    },

    // TODO: disable if indexedDB is on
    enabled: true,
    name: 'LocalStorage'
  };
}
