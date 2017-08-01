import _ from 'underscore';
import template from './dimStoreHeading.directive.html';
import dialogTemplate from './dimStoreHeading.directive.dialog.html';
import './dimStoreHeading.scss';

export const StoreHeadingComponent = {
  controller: StoreHeadingCtrl,
  controllerAs: 'vm',
  bindings: {
    store: '<storeData'
  },
  template
};

function StoreHeadingCtrl($scope, ngDialog, $i18next) {
  'ngInject';

  const vm = this;
  let dialogResult = null;

  function getLevelBar() {
    if (vm.store.percentToNextLevel) {
      return vm.store.percentToNextLevel;
    }
    if (vm.store.progression && vm.store.progression.progressions) {
      const prestige = _.find(vm.store.progression.progressions, {
        progressionHash: 2030054750
      });
      vm.xpTillMote = $i18next.t('Stats.Prestige', {
        level: prestige.level,
        exp: (prestige.nextLevelAt - prestige.progressToNextLevel)
      });
      return prestige.progressToNextLevel / prestige.nextLevelAt;
    }
    return 0;
  }

  $scope.$watch([
    'store.percentToNextLevel',
    'store.progression.progressions'
  ], () => {
    vm.levelBar = getLevelBar();
  });

  vm.openLoadoutPopup = function openLoadoutPopup(e) {
    e.stopPropagation();

    if (dialogResult === null) {
      ngDialog.closeAll();

      dialogResult = ngDialog.open({
        template: dialogTemplate,
        plain: true,
        appendTo: `div[loadout-id="${vm.store.id}"]`,
        overlay: false,
        className: 'loadout-popup',
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
