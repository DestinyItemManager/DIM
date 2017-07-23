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

function StoresCtrl(dimSettingsService, $scope, dimStoreService, dimPlatformService, loadingTracker, dimBucketService, dimInfoService, $i18next) {
  'ngInject';

  const vm = this;
  const didYouKnowTemplate = `<p>${$i18next.t('DidYouKnow.Collapse')}</p>
                              <p>${$i18next.t('DidYouKnow.Expand')}</p>`;
  // Only show this once per session
  const didYouKnow = _.once(() => {
    dimInfoService.show('collapsed', {
      title: $i18next.t('DidYouKnow.DidYouKnow'),
      body: didYouKnowTemplate,
      hide: $i18next.t('DidYouKnow.DontShowAgain')
    });
  });

  vm.buckets = null;
  vm.settings = dimSettingsService;
  vm.toggleSection = function(id) {
    didYouKnow();
    vm.settings.collapsedSections[id] = !vm.settings.collapsedSections[id];
    vm.settings.save();
  };

  // TODO: angular media-query-switch directive
  const phoneWidthQuery = window.matchMedia('(max-width: 375px)');
  function phoneWidthHandler(e) {
    $scope.$apply(() => {
      vm.isPhonePortrait = e.matches;
      console.log('phone width', e);
    });
  }
  phoneWidthQuery.addListener(phoneWidthHandler);
  vm.isPhonePortrait = phoneWidthQuery.matches;

  vm.$onChanges = function() {
    vm.vault = dimStoreService.getVault();

    if (!vm.buckets) {
      // TODO: deferring this to prevent manifest load... wise?
      dimBucketService.getBuckets().then((buckets) => {
        vm.buckets = buckets;
      });
    }

    // TODO: save this?
    if (vm.stores.length) {
      vm.currentStore = vm.stores[0];
      console.log('currentStore', vm.currentStore);
    } else {
      console.log('currentStore', vm.stores);
      vm.currentStore = null;
    }
  };
}
