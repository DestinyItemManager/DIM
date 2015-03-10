(function () {
  'use strict';

  angular.module('dimApp')
    .directive('dimStoreItemProperties', StoreItemProperties);

  function StoreItemProperties() {
    return {
      controller: StoreItemPropertiesController,
      controllerAs: 'vm',
      bindToController: true,
      restrict: 'A',
      scope: {
        item: '=dimItemProperties'
      },
      template: [
        '<div class="item-name" ng-bind-html="vm.title"></div>'
      ].join('')
    };

    StoreItemPropertiesController.$inject = ['$scope', '$sce'];

    function StoreItemPropertiesController($scope, $sce) {
      var vm = this;

      vm.title = $sce.trustAsHtml('');

      $scope.$watch('vm.item', function (item) {
        if (!_.isUndefined(item)) {
          vm.hasPrimaryStat = !_.isUndefined(item.primStat);
          vm.hasDefense = vm.hasPrimaryStat && (item.primStat.statHash === 3897883278);
          vm.hasAttack = vm.hasPrimaryStat && (item.primStat.statHash === 368428387);

          vm.title = $sce.trustAsHtml(item.name);

          if (vm.hasDefense) {
            if (item.stats.length === 4) {
              vm.title = $sce.trustAsHtml(vm.title + ' &#10022; ' + item.stats[0].value);
            }
          }
        }
      });
    }
  }
})();
