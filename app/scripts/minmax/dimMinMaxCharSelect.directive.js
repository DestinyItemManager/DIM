(function() {
  'use strict';

  var MinMaxCharSelect = {
    controller: MinMaxCharSelectCtrl,
    controllerAs: 'vm',
    bindings: {
      activeCharacters: '<',
      selectedCharacter: '=',
      onSelectedChange: '&'
    },
    templateUrl: 'scripts/minmax/dimMinMaxCharSelect.directive.html'
  };

  var MinMaxCharPopup = {
    controllerAs: 'vm',
    bindings: {
      activeCharacters: '<',
      selectedCharacter: '=',
      onSelected: '&'
    },
    templateUrl: 'scripts/minmax/dimMinMaxCharSelect.directive-2.html'
  };

  angular.module('dimApp')
    .component('dimMinMaxCharSelect', MinMaxCharSelect)
    .component('dimMinMaxCharPopup', MinMaxCharPopup);

  MinMaxCharSelectCtrl.$inject = ['$scope', 'ngDialog'];

  function MinMaxCharSelectCtrl($scope, ngDialog) {
    var vm = this;
    var dialogResult = null;

    vm.onSelected = function onSelected(idx) {
      if (vm.selectedCharacter !== idx) {
        var prev = vm.selectedCharacter;
        vm.selectedCharacter = idx;
        vm.onSelectedChange({ prev: prev, new: idx });
      }
      ngDialog.closeAll();
    };

    vm.openCharSelectPopup = function openCharSelectPopup(e) {
      e.stopPropagation();

      if (dialogResult === null) {
        ngDialog.closeAll();

        dialogResult = ngDialog.open({
          template: 'scripts/minmax/dimMinMaxCharSelect.directive-3.html',
          appendTo: 'div[id="char-select"]',
          overlay: false,
          className: 'char-popup',
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
})();
