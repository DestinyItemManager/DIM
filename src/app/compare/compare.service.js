export function CompareService($rootScope) {
  'ngInject';

  return {
    dialogOpen: false,
    addItemToCompare
  };

  function addItemToCompare(item, $event) {
    $rootScope.$broadcast('dim-store-item-compare', {
      item: item,
      clickEvent: $event
    });
  }
}
