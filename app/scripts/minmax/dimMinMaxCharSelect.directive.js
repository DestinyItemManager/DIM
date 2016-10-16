(function() {
  'use strict';

  var MinMaxCharSelect = {
    controller: MinMaxCharSelectCtrl,
    controllerAs: 'vm',
    bindings: {
      activeCharacters: '<',
      selectedCharacter: '='
    },
    template: [
      '<div class="minmax-select-box" ng-style="{ \'background-image\': \'url(\' + vm.activeCharacters[0].background + \')\' }">',
      '  <div class="emblem" ng-style="{ \'background-image\': \'url(\' + vm.activeCharacters[0].icon + \')\' }"></div>',
      '  <div class="race-gender">{{:: vm.activeCharacters[0].genderRace }}</div>',
      '  <div class="level"><span translate="Level"></span> {{ vm.activeCharacters[0].level }}</div>',
      '  <div class="level powerLevel">{{ vm.activeCharacters[0].powerLevel }}</div>',
      '  <div class="minmax-select-button" title="{{ \'Characters\' | translate }}" ng-click="vm.openCharSelectPopup($event)"><i class="fa fa-chevron-down"></i></div>',
      '</div>',
      '<div id="char-select"></div>'
    ].join('')
  };

  var MinMaxCharPopup = {
    controller: MinMaxCharSelectCtrl,
    controllerAs: 'vm',
    bindings: {
      activeCharacters: '<',
      selectedCharacter: '='
    },
    template: [
      '<div class="minmax-select-box" ng-repeat="(idx, char) in vm.activeCharacters" ng-click="vm.selectCharacter(idx)" style="width:210px" ng-style="{ \'background-image\': \'url(\' + char.background + \')\' }">',
      '  <div class="emblem" ng-style="{ \'background-image\': \'url(\' + char.icon + \')\' }"></div>',
      '  <div class="race-gender">{{:: char.genderRace }}</div>',
      '  <div class="level"><span translate="Level"></span> {{ char.level }}</div>',
      '  <div class="level powerLevel">{{ char.powerLevel }}</div>',
      '</div>',
    ].join('')
  };

  angular.module('dimApp')
    .component('dimMinMaxCharSelect', MinMaxCharSelect)
    .component('dimMinMaxCharPopup', MinMaxCharPopup);

  MinMaxCharSelectCtrl.$inject = ['$scope', 'ngDialog'];

  function MinMaxCharSelectCtrl($scope, ngDialog) {
    var vm = this;
    var dialogResult = null;

    vm.selectCharacter = function selectCharacter(index) {
      vm.selectedCharacter = index;
      ngDialog.closeAll();
    };

    vm.openCharSelectPopup = function openCharSelectPopup(e) {
      e.stopPropagation();

      if (dialogResult === null) {
        ngDialog.closeAll();

        dialogResult = ngDialog.open({
          template: [
            '<div ng-click="$event.stopPropagation();" dim-click-anywhere-but-here="closeThisDialog()" dim-min-max-char-popup="vm.store">',
            '  <dim-min-max-char-popup active-characters="vm.activeCharacters" selected-character="vm.selectedCharacter"></dim-min-max-char-popup>',
            '</div>'].join(''),
          plain: true,
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
