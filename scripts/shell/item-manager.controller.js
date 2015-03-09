(function () {
  'use strict';

  angular.module('dimApp')
    .controller('ItemManagerCtrl', ItemManager);

  ItemManager.$inject = ['$scope', '$window'];

  function ItemManager($scope, $window) {
    var vm = this;

    vm.data = $window.dimDO;

    $scope.$watchCollection(function () {
      return $window.dimDO;
    }, function (newCollection) {
      vm.data = newCollection;
    });
  }
})();
