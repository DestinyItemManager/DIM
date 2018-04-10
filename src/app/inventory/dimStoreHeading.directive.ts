import * as _ from 'underscore';
import template from './dimStoreHeading.directive.html';
import dialogTemplate from './dimStoreHeading.directive.dialog.html';
import './dimStoreHeading.scss';
import { IComponentOptions, IController, IScope } from 'angular';
import { DimStore } from './store/d2-store-factory.service';

export const StoreHeadingComponent: IComponentOptions = {
  controller: StoreHeadingCtrl,
  controllerAs: 'vm',
  bindings: {
    store: '<storeData',
    internalLoadoutMenu: '<internalLoadoutMenu',
    selectedStore: '<',
    onTapped: '&'
  },
  template
};

function StoreHeadingCtrl(
  this: IController & {
    store: DimStore;
    selectedStore: DimStore;
    internalLoadoutMenu: boolean;
    onTapped();
  },
  $scope: IScope,
  ngDialog,
  $i18next
) {
  "ngInject";

  const vm = this;
  let dialogResult: any = null;

  function getLevelBar() {
    if (vm.store.percentToNextLevel) {
      return vm.store.percentToNextLevel;
    }
    if (vm.store.progression && vm.store.progression.progressions) {
      const prestige = _.find(vm.store.progression.progressions, {
        progressionHash: 2030054750
      })!;
      vm.xpTillMote = $i18next.t(
        vm.store.destinyVersion === 1 ? "Stats.Prestige" : "Stats.PrestigeD2",
        {
          level: prestige.level,
          exp: prestige.nextLevelAt - prestige.progressToNextLevel
        }
      );
      return prestige.progressToNextLevel / prestige.nextLevelAt;
    }
    return 0;
  }

  $scope.$watchGroup(
    ["store.percentToNextLevel", "store.progression.progressions"],
    () => {
      vm.levelBar = getLevelBar();
    }
  );

  vm.openLoadoutPopup = function openLoadoutPopup(e) {
    e.stopPropagation();

    if (vm.store !== vm.selectedStore && !vm.internalLoadoutMenu) {
      vm.onTapped();
      return;
    }

    if (dialogResult === null) {
      ngDialog.closeAll();

      dialogResult = ngDialog.open({
        template: dialogTemplate,
        plain: true,
        appendTo: `div[loadout-id="${vm.store.id}"]`,
        overlay: false,
        className: "loadout-popup",
        showClose: false,
        scope: $scope
      });

      dialogResult.closePromise.then(() => {
        dialogResult = null;
      });
    } else {
      dialogResult.close();
    }
  };
}
