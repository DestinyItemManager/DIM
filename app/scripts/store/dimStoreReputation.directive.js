(function() {
  'use strict';

  var StoreReputation = {
    controllerAs: 'vm',
    bindings: {
      store: '<storeData'
    },
    templateUrl: 'scripts/store/dimStoreReputation.directive.html'
  };

  angular.module('dimApp')
    .component('dimStoreReputation', StoreReputation);
})();
