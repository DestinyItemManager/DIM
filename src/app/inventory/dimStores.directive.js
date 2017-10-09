import _ from 'underscore';
import template from './dimStores.directive.html';
import './dimStores.scss';

export const StoresComponent = {
  controller: StoresCtrl,
  controllerAs: 'vm',
  bindings: {
    stores: '<',
    buckets: '<'
  },
  template
};

function StoresCtrl(dimSettingsService, $scope, dimPlatformService, loadingTracker, dimBucketService, dimInfoService, $i18next, $filter) {
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

  vm.swipeLeft = () => {
    const sortedStores = $filter('sortStores')(vm.stores, dimSettingsService.characterOrder);
    const currentIndex = sortedStores.indexOf(vm.selectedStore);

    if (currentIndex < (sortedStores.length - 1)) {
      vm.selectedStore = sortedStores[currentIndex + 1];
    }
  };

  vm.swipeRight = () => {
    const sortedStores = $filter('sortStores')(vm.stores, dimSettingsService.characterOrder);
    const currentIndex = sortedStores.indexOf(vm.selectedStore);

    if (currentIndex > 0) {
      vm.selectedStore = sortedStores[currentIndex - 1];
    }
  };
  vm.buckets = null;
  vm.settings = dimSettingsService;
  vm.toggleSection = function(id) {
    // Only tip when collapsing
    if (!vm.settings.collapsedSections[id]) {
      didYouKnow();
    }
    vm.settings.collapsedSections[id] = !vm.settings.collapsedSections[id];
    vm.settings.save();
  };

  // TODO: angular media-query-switch directive
  // This seems like a good breakpoint for portrait based on https://material.io/devices/
  // We can't use orientation:portrait because Android Chrome messes up when the keyboard is shown: https://www.chromestatus.com/feature/5656077370654720
  const phoneWidthQuery = window.matchMedia('(max-device-width: 540px)');
  function phoneWidthHandler(e) {
    $scope.$apply(() => {
      vm.isPhonePortrait = e.matches;
    });
  }
  phoneWidthQuery.addListener(phoneWidthHandler);
  vm.isPhonePortrait = phoneWidthQuery.matches;

  vm.$onChanges = function() {
    vm.vault = _.find(vm.stores, 'isVault');

    if (vm.stores && vm.stores.length) {
      // This is the character that was last played
      vm.currentStore = _.find(vm.stores, 'current');

      // This is the character selected to display in mobile view
      if (!vm.selectedStore || !_.find(vm.stores, { id: vm.selectedStore.id })) {
        vm.selectedStore = vm.currentStore;
      } else {
        vm.selectedStore = _.find(vm.stores, { id: vm.selectedStore.id });
      }
      vm.selectedStoreIndex = $filter('sortStores')(vm.stores, dimSettingsService.characterOrder).indexOf(vm.selectedStore);
    } else {
      vm.selectedStore = null;
      vm.currentStore = null;
    }
  };
}
