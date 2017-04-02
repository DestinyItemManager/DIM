import angular from 'angular';

angular.module('dimApp')
  .factory('dimItemDiscussService', ItemDiscussService);

function ItemDiscussService($rootScope) {
  return {
    dialogOpen: false,
    addItemToDiscuss: addItemToDiscuss
  };

  function addItemToDiscuss(item, $event) {
    $rootScope.$broadcast('dim-store-item-discuss', {
      item: item,
      clickEvent: $event
    });
  }
}
