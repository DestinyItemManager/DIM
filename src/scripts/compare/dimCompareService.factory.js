import angular from 'angular';

angular.module('dimApp')
  .factory('dimCompareService', CompareService);

function CompareService($rootScope) {
  return {
    dialogOpen: false,
    addItemToCompare: addItemToCompare
  };
  function addItemToCompare(item, $event) {
    $rootScope.$broadcast('dim-store-item-compare', {
      item: item,
      clickEvent: $event
    });
  }
}
