(function() {
  'use strict';

  angular.module('dimApp')
    .directive('dimStoreItems', StoreItems);

  StoreItems.$inject = ['dimStoreService', '$window'];

  function StoreItems(dimStoreService, $window) {
    return {
      controller: StoreItemsCtrl,
      controllerAs: 'vm',
      bindToController: true,
      replace: true,
      scope: {
        'store': '=storeData'
      },
      template: [
        '<div>',
        '  <div class="items {{::vm.store.id }}" data-type="item" data-character="{{::vm.store.id }}">',
        '    <div ng-repeat="(category, buckets) in ::vm.categories track by category" class="section" ng-class="::category | lowercase">',
        '      <div class="title">',
        '        <span>{{ ::category }}</span>',
        '        <span class="bucket-count" ng-if="::vm.store.id === \'vault\'">{{ vm.sortSize[category] ? vm.sortSize[category] : 0 }}/{{::vm.store.capacityForItem({sort:category})}}  </span>',
        '      </div>',
        '      <dim-store-bucket ng-repeat="bucket in ::buckets track by bucket.id" store-data="vm.store" bucket-items="vm.data[bucket.type]" bucket="bucket"></dim-store-bucket>',
        '    </div>',
        '    <div ng-if="::vm.store.id !== \'vault\'" class="title">',
        '      <span>Reputation</span>',
        '    </div>',
        '    <div class="sub-section sort-progression">',
        '      <div class="unequipped">',
        '        <span class="item" ng-if="faction.color" ng-repeat="faction in vm.store.progression.progressions | orderBy:\'order\' track by $index" title="{{faction.label}}\n{{faction.progressToNextLevel}}/{{faction.nextLevelAt}}">',
        '          <svg width="48" height="48">',
        '            <polygon stroke-dasharray="130" fill="{{faction.color}}" points="24,1 47,24 24,47 1,24"/>',
        '            <image xlink:href="" ng-attr-xlink:href="{{faction.icon | bungieIcon}}" ng-attr-x="{{faction.scale === \'.8\' ? 6 : 48-(faction.scale*48)}}" ng-attr-y="{{faction.scale === \'.8\' ? 6 : 48-(faction.scale*48)}}" width="48" height="48" ng-attr-transform="scale({{faction.scale}})" />',
        '            <polygon fill-opacity="0" stroke="#666" stroke-width="2" points="24,1 47,24 24,47 1,24" stroke-linecap="square"/>',
        '            <polygon stroke-dasharray="130" ng-if="faction.progressToNextLevel > 0" style="stroke-dashoffset:{{130-(130*faction.progressToNextLevel/faction.nextLevelAt)}}" fill-opacity="0" stroke="#FFF" stroke-width="2" points="24,1 47,24 24,47 1,24" stroke-linecap="square"/>',
        '          </svg>',
        '          <span class="item-stat item-faction" ng-bind="faction.level"></span>',
        '        </span>',
        '      </div>',
        '    </div>',
        '  </div>',
        '</div>'
      ].join('')
    };
  }


  StoreItemsCtrl.$inject = ['$scope', 'dimStoreService', 'dimCategory', 'dimInfoService', 'dimBucketService'];

  function StoreItemsCtrl($scope, dimStoreService, dimCategory, dimInfoService, dimBucketService) {
    var vm = this;

    vm.sortSize = _.countBy(vm.store.items, 'sort');

    function resetData() {
      dimBucketService.then(function(buckets) {
        vm.categories = buckets.byCategory; // Grouping of the types in the rows.

        dimStoreService.updateProgression();

        if (_.any(vm.store.items, {type: 'Unknown'})) {
          vm.categories['Unknown'] = [{
            type: 'Unknown',
            id: 'BUCKET_UNKNOWN'
          }];
        }

        if (vm.store.isVault) {
          vm.sortSize = _.countBy(vm.store.items, function(item) {
            return item.location.sort;
          });
        }

        vm.data = _.groupBy(vm.store.items, function(item) {
          return item.location.type;
        });

        if (count(vm.store.items, {type: 'Lost Items'}) >= 20) {
          dimInfoService.show('lostitems', {
            type: 'warning',
            title: 'Postmaster Limit',
            body: 'There are 20 lost items at the Postmaster on your ' + vm.store.name + '. Any new items will overwrite the existing.',
            hide: 'Never show me this type of warning again.'
          });
        }
      });
    }

    $scope.$watchCollection('vm.store.items', resetData);
  }
})();
