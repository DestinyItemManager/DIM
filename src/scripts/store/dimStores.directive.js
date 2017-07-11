import angular from 'angular';
import _ from 'underscore';
import template from './dimStores.directive.html';

angular.module('dimApp')
  .component('dimStores', stores());

function stores() {
  return {
    controller: StoresCtrl,
    controllerAs: 'vm',
    bindings: {
      stores: '<'
    },
    template
  };
}

function StoresCtrl(dimSettingsService, $scope, dimStoreService, dimPlatformService, loadingTracker, dimBucketService, dimInfoService, $translate) {
  'ngInject';

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

  vm.buckets = null;
  vm.settings = dimSettingsService;
  vm.toggleSection = function(id) {
    didYouKnow();
    vm.settings.collapsedSections[id] = !vm.settings.collapsedSections[id];
    vm.settings.save();
  };

  vm.$onChanges = function() {
    vm.vault = dimStoreService.getVault();

    if (!vm.buckets) {
      // TODO: deferring this to prevent manifest load... wise?
      dimBucketService.getBuckets().then((buckets) => {
        vm.buckets = buckets;
      });
    }
  };
}
