import * as _ from 'underscore';
import template from './dimStores.directive.html';
import './Stores.scss';
import { isPhonePortraitStream } from '../mediaQueries';
import { subscribeOnScope } from '../rx-utils';
import { settings } from '../settings/settings';
import { showInfoPopup } from '../shell/info-popup';
import { IComponentOptions, IController, IScope, IRootScopeService } from 'angular';
import { sortStores } from '../shell/dimAngularFilters.filter';
import { DimStore } from './store-types';
import { DimItem } from './item-types';
import { InventoryBuckets } from './inventory-buckets';

export const StoresComponent: IComponentOptions = {
  controller: StoresCtrl,
  controllerAs: 'vm',
  bindings: {
    stores: '<',
    buckets: '<'
  },
  template
};

function StoresCtrl(
  this: IController & {
    stores: DimStore[];
    buckets: InventoryBuckets;
    vault: DimStore | null;
    currentStore: DimStore | null;
    selectedStore: DimStore | null;
    selectedStoreIndex: number;
  },
  $scope: IScope,
  $rootScope: IRootScopeService & { dragItem: DimItem },
  $i18next
) {
  'ngInject';

  const vm = this;
  const didYouKnowTemplate = `<p>${$i18next.t('DidYouKnow.Collapse')}</p>
                              <p>${$i18next.t('DidYouKnow.Expand')}</p>`;
  // Only show this once per session
  const didYouKnow = _.once(() => {
    showInfoPopup('collapsed', {
      title: $i18next.t('DidYouKnow.DidYouKnow'),
      body: didYouKnowTemplate,
      hide: $i18next.t('DidYouKnow.DontShowAgain')
    });
  });

  vm.swipeLeft = () => {
    if ($rootScope.dragItem || !vm.selectedStore) {
      return;
    }

    const sortedStores = sortStores(vm.stores, settings.characterOrder);
    const currentIndex = sortedStores.indexOf(vm.selectedStore);

    if (currentIndex < sortedStores.length - 1) {
      vm.selectedStore = sortedStores[currentIndex + 1];
    }
  };

  vm.swipeRight = () => {
    if ($rootScope.dragItem || !vm.selectedStore) {
      return;
    }

    const sortedStores = sortStores(vm.stores, settings.characterOrder);
    const currentIndex = sortedStores.indexOf(vm.selectedStore);

    if (currentIndex > 0) {
      vm.selectedStore = sortedStores[currentIndex - 1];
    }
  };
  vm.settings = settings;
  vm.toggleSection = (id) => {
    // Only tip when collapsing
    if (!vm.settings.collapsedSections[id]) {
      didYouKnow();
    }
    vm.settings.collapsedSections[id] = !vm.settings.collapsedSections[id];
    vm.settings.save();
  };

  subscribeOnScope($scope, isPhonePortraitStream(), (isPhonePortrait) => {
    $scope.$apply(() => {
      vm.isPhonePortrait = isPhonePortrait;
    });
  });

  vm.$onChanges = () => {
    vm.vault = (vm.stores && vm.stores.find((s) => s.isVault)) || null;

    if (vm.stores && vm.stores.length) {
      // This is the character that was last played
      vm.currentStore = vm.stores.find((s) => s.current) || null;

      // This is the character selected to display in mobile view
      vm.selectedStore =
        !vm.selectedStore || !vm.stores.find((s) => s.id === vm.selectedStore!.id)
          ? vm.currentStore
          : vm.stores.find((s) => s.id === vm.selectedStore!.id) || null;
      if (vm.selectedStore) {
        vm.selectedStoreIndex = sortStores(vm.stores, settings.characterOrder).indexOf(
          vm.selectedStore
        );
      }
    } else {
      vm.selectedStore = null;
      vm.currentStore = null;
    }
  };
}
