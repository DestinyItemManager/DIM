import angular from 'angular';
import _ from 'underscore';
import template from './dimStores.directive.html';

angular.module('dimApp')
  .directive('dimStores', Stores);

function Stores() {
  return {
    controller: StoresCtrl,
    controllerAs: 'vm',
    bindToController: true,
    scope: {},
    template: template
  };
}


function StoresCtrl(dimSettingsService, $scope, dimStoreService, dimPlatformService, loadingTracker, dimBucketService, dimInfoService, $translate) {
  const vm = this;
  const didYouKnowTemplate = `<p>${$translate.instant('DidYouKnow.Collapse')}</p>
                              <p>${$translate.instant('DidYouKnow.Expand')}</p>`;
  // Only show this once per session
  const didYouKnow = _.once(() => {
    dimInfoService.show('collapsed', {
      title: $translate.instant('DidYouKnow'),
      body: didYouKnowTemplate,
      hide: $translate.instant('DidYouKnow.DontShowAgain')
    });
  });

  vm.settings = dimSettingsService;
  vm.stores = dimStoreService.getStores();
  vm.vault = dimStoreService.getVault();
  vm.buckets = null;
  dimBucketService.getBuckets().then((buckets) => {
    vm.buckets = angular.copy(buckets);
  });
  vm.toggleSection = function(id) {
    didYouKnow();
    vm.settings.collapsedSections[id] = !vm.settings.collapsedSections[id];
    vm.settings.save();
  };

  $scope.$on('dim-stores-updated', (e, stores) => {
    vm.stores = stores.stores;
    vm.vault = dimStoreService.getVault();
  });

  if (!vm.stores.length && dimPlatformService.getActive()) {
    loadingTracker.addPromise(dimStoreService.reloadStores());
  }
}
