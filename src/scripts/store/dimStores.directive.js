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
    link: Link,
    template: template
  };

  function Link($scope) {
    function stickyHeader(e) {
      $(document.body).toggleClass('something-is-sticky', document.body.scrollTop !== 0);
    }

    $(document).on('scroll', stickyHeader);

    $scope.$on('$destroy', function() {
      $(document).off('scroll', stickyHeader);
    });
  }
}


function StoresCtrl(dimSettingsService, $scope, dimStoreService, dimPlatformService, loadingTracker, dimBucketService, dimInfoService, $i18next) {
  var vm = this;
  const didYouKnowTemplate = `<p>${$i18next.t('DidYouKnow.Collapse')}</p>
                              <p>${$i18next.t('DidYouKnow.Expand')}</p>`;
  // Only show this once per session
  const didYouKnow = _.once(() => {
    dimInfoService.show('collapsed', {
      title: $i18next.t('DidYouKnow'),
      body: didYouKnowTemplate,
      hide: $i18next.t('DidYouKnow.DontShowAgain')
    });
  });

  vm.settings = dimSettingsService;
  vm.stores = dimStoreService.getStores();
  vm.vault = dimStoreService.getVault();
  vm.buckets = null;
  dimBucketService.getBuckets().then(function(buckets) {
    vm.buckets = angular.copy(buckets);
  });
  vm.toggleSection = function(id) {
    didYouKnow();
    vm.settings.collapsedSections[id] = !vm.settings.collapsedSections[id];
    vm.settings.save();
  };

  $scope.$on('dim-stores-updated', function(e, stores) {
    vm.stores = stores.stores;
    vm.vault = dimStoreService.getVault();
  });

  if (!vm.stores.length && dimPlatformService.getActive()) {
    loadingTracker.addPromise(dimStoreService.reloadStores());
  }
}
