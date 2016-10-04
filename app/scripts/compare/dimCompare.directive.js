(function() {
  'use strict';

  angular.module('dimApp').directive('dimCompare', Compare);

  Compare.$inject = ['dimCompareService'];

  function Compare(dimCompareService) {
    return {
      controller: CompareCtrl,
      controllerAs: 'vm',
      bindToController: true,
      link: Link,
      scope: {},
      template: [
        '<div id="loadout-drawer" ng-if="vm.show" class="loadout-create">',
        '  <div ng-messages="vm.form.name.$error" ng-if="vm.form.$submitted || vm.form.name.$touched">',
        '    <div ng-message="required">A name is required.</div>',
        '    <div ng-message="minlength">...</div>',
        '    <div ng-message="maxlength">...</div>',
        '  </div>',
        '  <div class="loadout-content">',
        '    <div id="loadout-options">',
        '      <form name="vm.form">',
        '        <input name="name" ng-model="vm.loadout.name" minlength="1" maxlength="50" required type="search" placeholder="Loadout Name..." />',
        '        <select name="classType" ng-model="vm.loadout.classType" ng-options="item.value as item.label for item in vm.classTypeValues"></select>',
        '        <input type="button" ng-disabled="vm.form.$invalid" value="Save" ng-click="vm.save()"></input>',
        '        <input type="button" ng-disabled="vm.form.$invalid || !vm.loadout.id" value="Save as New" ng-click="vm.saveAsNew()"></input>',
        '        <input type="button" ng-click="vm.cancel()" value="Cancel"></input>',
        '        <span>Items with the <img src="images/spartan.png" style="border: 1px solid #333; background-color: #f00; margin: 0 2px; width: 16px; height: 16px;  vertical-align: text-bottom;"> icon will be equipped.  Click on an item toggle equip.</span>',
        '        <p id="loadout-error"></p>',
        '      </form>',
        '    </div>',
        '    <p ng-if="vm.loadout.warnitems.length">These vendor items cannot be equipped:</p>',
        '    <div ng-if="vm.loadout.warnitems.length" class="loadout-contents">',
        '      <div ng-repeat="item in vm.loadout.warnitems" id="loadout-warn-item-{{:: $index }}" class="loadout-item">',
        '        <dim-simple-item item-data="item"></dim-simple-item>',
        '        <div class="fa warn"></div>',
        '      </div>',
        '    </div>',
        '    <p ng-if="vm.loadout.warnitems.length" >These items can be equipped:</p>',
        '    <div id="loadout-contents" class="loadout-contents">',
        '        <div ng-repeat="item in vm.loadout.items[value] | sortItems:vm.settings.itemSort track by item.index" ng-click="vm.equip(item)" id="loadout-item-{{:: $id }}" class="loadout-item">',
        '          <dim-simple-item item-data="item"></dim-simple-item>',
        '          <div class="close" ng-click="vm.remove(item, $event); vm.form.name.$rollbackViewValue(); $event.stopPropagation();"></div>',
        '          <div class="equipped" ng-show="item.equipped"></div>',
        '        </div>',
        '    </div>',
        '  </div>',
        '</div>'
      ].join('')
    };

    function Link(scope) {
      var vm = scope.vm;

      scope.$on('dim-compare', function() {
        vm.show = true;
        dimCompareService.dialogOpen = true;
        vm.items = angular.copy(vm.defaults);
      });

      scope.$on('dim-store-item-clicked', function(event, args) {
        vm.add(args.item, args.clickEvent);
      });

      scope.$on('dim-active-platform-updated', function() {
        vm.show = false;
      });
    }
  }

  CompareCtrl.$inject = ['dimCompareService', 'dimCategory', 'toaster', 'dimPlatformService', 'dimSettingsService'];

  function CompareCtrl(dimCompareService, dimCategory, toaster, dimPlatformService, dimSettingsService) {
    var vm = this;

    vm.settings = dimSettingsService;

    vm.show = false;
    dimCompareService.dialogOpen = false;

    vm.cancel = function cancel() {
      vm.comparisons = [];
      dimCompareService.dialogOpen = false;
      vm.show = false;
    };

    vm.add = function add(item, $event) {
      if (!item.inWeapons && !item.inArmor) {
        return;
      }
      var clone = angular.copy(item);
    };

    vm.remove = function remove(item, $event) {

    };

  }
})();
