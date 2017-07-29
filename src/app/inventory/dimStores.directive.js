import _ from 'underscore';
import template from './dimStores.directive.html';

export const StoresComponent = {
  controller: StoresCtrl,
  controllerAs: 'vm',
  bindings: {
    stores: '<'
  },
  template
};

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
