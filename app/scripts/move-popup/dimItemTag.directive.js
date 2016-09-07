
(function() {
  'use strict';

  angular.module('dimApp').component('dimItemTag', {
    controller: ItemTagController,
    bindings: {
      item: '='
    },
    template: `
      <select ng-options="tag as tag.label for tag in $ctrl.settings.itemTags track by tag.type" ng-model="$ctrl.selected" ng-change="$ctrl.updateTag()"></select>
    `
  });

  ItemTagController.$inject = ['$rootScope', 'SyncService', 'dimPlatformService', 'dimSettingsService', 'dimItemTagService'];

  function ItemTagController($rootScope, SyncService, dimPlatformService, dimSettingsService, dimItemTagService) {
    var vm = this;

    vm.settings = dimSettingsService;
    vm.selected = _.find(vm.settings.itemTags, function(tag) {
      return tag.type === vm.item.tag;
    });

    vm.updateTag = function() {
      vm.item.tag = vm.selected.type;
      $rootScope.$broadcast('dim-filter-invalidate');
      SyncService.get().then(function(data) {
        data = data[dimItemTagService.getKey()] || {};
        data[vm.item.id] = { id: vm.item.id, type: vm.item.tag };
        SyncService.set(data);
      });
    };
  }
})();


