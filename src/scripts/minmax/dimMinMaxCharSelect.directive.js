import angular from 'angular';

var MinMaxCharSelect = {
  controller: MinMaxCharSelectCtrl,
  controllerAs: 'vm',
  bindings: {
    activeCharacters: '<',
    selectedCharacter: '=',
    onSelectedChange: '&'
  },
  template: [
    '<div class="minmax-select-box" ng-style="{ \'background-image\': \'url(\' + vm.activeCharacters[vm.selectedCharacter].background + \')\' }">',
    '  <div class="emblem" ng-style="{ \'background-image\': \'url(\' + vm.activeCharacters[vm.selectedCharacter].icon + \')\' }"></div>',
    '  <div class="class">{{ vm.activeCharacters[vm.selectedCharacter].className }}</div>',
    '  <div class="race-gender">{{ vm.activeCharacters[vm.selectedCharacter].genderRace }}</div>',
    '  <div class="level"><span translate="Stats.Level"></span> {{ vm.activeCharacters[vm.selectedCharacter].level }}</div>',
    '  <div class="level powerLevel">{{ vm.activeCharacters[vm.selectedCharacter].powerLevel }}</div>',
    '  <div class="minmax-select-button" translate-attr="{ title: \'LB.Guardians\' }" ng-click="vm.openCharSelectPopup($event)"><i class="fa fa-chevron-down"></i></div>',
    '</div>',
    '<div id="char-select"></div>'
  ].join('')
};

var MinMaxCharPopup = {
  controllerAs: 'vm',
  bindings: {
    activeCharacters: '<',
    selectedCharacter: '=',
    onSelected: '&'
  },
  template: [
    '<div class="minmax-select-box dropdown-option" ng-repeat="(idx, char) in vm.activeCharacters" ng-show="idx !== vm.selectedCharacter" ng-click="vm.onSelected({idx: idx})" ng-style="{ \'background-image\': \'url(\' + char.background + \')\' }">',
    '  <div class="emblem" ng-style="{ \'background-image\': \'url(\' + char.icon + \')\' }"></div>',
    '  <div class="class">{{ char.className }}</div>',
    '  <div class="race-gender">{{:: char.genderRace }}</div>',
    '  <div class="level"><span translate="Level"></span> {{ char.level }}</div>',
    '  <div class="level powerLevel">{{ char.powerLevel }}</div>',
    '</div>'
  ].join('')
};

angular.module('dimApp')
  .component('dimMinMaxCharSelect', MinMaxCharSelect)
  .component('dimMinMaxCharPopup', MinMaxCharPopup);

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
        template: [
          '<div ng-click="$event.stopPropagation();" dim-click-anywhere-but-here="closeThisDialog()">',
          '  <dim-min-max-char-popup active-characters="vm.activeCharacters" selected-character="vm.selectedCharacter" on-selected="vm.onSelected(idx)"></dim-min-max-char-popup>',
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