
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

  ItemTagController.$inject = ['SyncService', 'dimPlatformService', 'dimSettingsService'];

  function ItemTagController(SyncService, dimPlatformService, dimSettingsService) {
    var vm = this;

    vm.settings = dimSettingsService;

    vm.selected = _.find(vm.settings.itemTags, function(tag) {
      return tag.type === vm.item.tag;
    });

    vm.updateTag = function() {
      vm.item.tag = vm.selected.type;

      SyncService.get().then(function(data) {
        if (!data[itemTagKey()]) {
          data[itemTagKey()] = {};
        }
        data[itemTagKey()][vm.item.id] = { id: vm.item.id, type: vm.item.tag };

        SyncService.set(data);
      });
    };

    function itemTagKey() {
      const platform = dimPlatformService.getActive();
      return 'taggedItems-' + (platform ? platform.type : '');
    }
  }
})();


