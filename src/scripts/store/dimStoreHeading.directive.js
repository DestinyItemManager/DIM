import angular from 'angular';
import _ from 'underscore';
import template from './dimStoreHeading.directive.html';
import dialogTemplate from './dimStoreHeading.directive.dialog.html';

angular.module('dimApp')
  .directive('dimStoreHeading', StoreHeading);

function StoreHeading() {
  return {
    controller: StoreHeadingCtrl,
    controllerAs: 'vm',
    bindToController: true,
    scope: {
      store: '=storeData'
    },
    restrict: 'E',
    template: template
  };
}

function StoreHeadingCtrl($scope, ngDialog, $translate) {
  const vm = this;
  let dialogResult = null;

  function getLevelBar() {
    if (vm.store.percentToNextLevel) {
      return vm.store.percentToNextLevel;
    }
    if (vm.store.progression && vm.store.progression.progressions) {
      const prestige = _.findWhere(vm.store.progression.progressions, {
        progressionHash: 2030054750
      });
      vm.xpTillMote = $translate.instant('Stats.Prestige', {
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
