
(function() {
  'use strict';

  angular.module('dimApp').component('dimItemTag', {
    controller: ItemTagController,
    bindings: {
      item: '='
    },
    template: `
      <select ng-options="tag as tag.label | translate for tag in $ctrl.settings.itemTags track by tag.type" ng-model="$ctrl.selected" ng-change="$ctrl.updateTag()"></select>
    `
  });

  ItemTagController.$inject = ['$scope', '$rootScope', 'dimSettingsService'];

  function ItemTagController($scope, $rootScope, dimSettingsService) {
    var vm = this;

    vm.settings = dimSettingsService;
    $scope.$watch('$ctrl.item.dimInfo.tag', function() {
      vm.selected = _.find(vm.settings.itemTags, function(tag) {
        return tag.type === vm.item.dimInfo.tag;
      });
    });

    vm.updateTag = function() {
      vm.item.dimInfo.tag = vm.selected.type;
      $rootScope.$broadcast('dim-filter-invalidate');
      vm.item.dimInfo.save();
    };

    $scope.$on('dim-item-tag', (e, args) => {
      if (vm.item.dimInfo.tag === args.tag) {
        delete vm.item.dimInfo.tag;
      } else {
        vm.item.dimInfo.tag = args.tag;
      }
      $rootScope.$broadcast('dim-filter-invalidate');
      vm.item.dimInfo.save();
    });
  }
})();


