import angular from 'angular';
import _ from 'underscore';

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
    templateUrl: require('./dimStoreHeading.directive.template.html')
  };
}

function StoreHeadingCtrl($scope, ngDialog, $translate) {
  var vm = this;
  var dialogResult = null;

  function getLevelBar() {
    if (vm.store.percentToNextLevel) {
      return vm.store.percentToNextLevel;
    }
    if (vm.store.progression && vm.store.progression.progressions) {
      var prestige = _.findWhere(vm.store.progression.progressions, {
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
  ], function() {
    vm.levelBar = getLevelBar();
  });

  vm.openLoadoutPopup = function openLoadoutPopup(e) {
    e.stopPropagation();

    if (dialogResult === null) {
      ngDialog.closeAll();

      dialogResult = ngDialog.open({
        template: '<div ng-click="$event.stopPropagation();" dim-click-anywhere-but-here="closeThisDialog()" dim-loadout-popup="vm.store"></div>',
        plain: true,
        appendTo: 'div[loadout-id="' + vm.store.id + '"]',
        overlay: false,
        className: 'loadout-popup',
        showClose: false,
        scope: $scope
      });

      dialogResult.closePromise.then(function() {
        dialogResult = null;
      });
    } else {
      dialogResult.close();
    }
  };
}
