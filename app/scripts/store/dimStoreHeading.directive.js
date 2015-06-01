/*jshint -W027*/

(function() {
  'use strict';

  angular.module('dimApp')
    .directive('dimStoreHeading', StoreHeading);

  StoreHeading.$inject = ['ngDialog'];

  function StoreHeading(ngDialog) {
    return {
      controller: StoreHeadingCtrl,
      controllerAs: 'vm',
      bindToController: true,
      scope: {
        'store': '=storeData'
      },
      link: Link,
      template: [
        '<div class="character-box" ng-class="vm.isGuardian ? \'\' : \'vault-box\'">',
        '  <div class="emblem" ng-show="vm.isGuardian"></div>',
        '  <div class="class">{{ vm.class || "Vault" }}</div>',
        '  <div class="race-gender" ng-show="vm.isGuardian">{{ vm.race }} {{ vm.gender }}</div>',
        '  <div class="level" ng-show="vm.isGuardian" ng-class="vm.isPrestigeLevel ? \'prestige\' : \'\'">{{ vm.level }}</div>',
        '  <div class="levelBar" ng-show="vm.isGuardian">',
        '    <div class="barFill" ng-class="vm.isPrestigeLevel ? \'prestige\' : \'\'" ng-style="{width: vm.percentToNextLevel + \'%\'}"></div>',
        '  </div>',
        '</div>',
        '<div class="loadout-button" ng-show="vm.isGuardian" ng-click="vm.openLoadoutPopup($event)">&#x25BC;</div>',
        '<div loadout-id="{{ vm.store.id }}" style="position: relative;"></div>'
      ].join('')
    };

    function Link(scope, element) {
      var vm = scope.vm;
      var dialogResult = null;

      $(document).ready(function() {
        element.scrollToFixed({
          marginTop: 51,
          fixed: function() {
            $(document.body).addClass('something-is-sticky');
            $(this).addClass('fixed-header');
          },
          unfixed: function() {
            $(document.body).removeClass('something-is-sticky');
            $(this).removeClass('fixed-header');
          }
        });
      });

      vm.openLoadoutPopup = function openLoadoutPopup(e) {
        e.stopPropagation();

        if (!_.isNull(dialogResult)) {
          dialogResult.close();
        } else {
          ngDialog.closeAll();

          dialogResult = ngDialog.open({
            template: '<div ng-click="$event.stopPropagation();" dim-class="vm[\'class\']" dim-click-anywhere-but-here="vm.closeLoadoutPopup()" dim-loadout-popup="vm.store"></div>',
            plain: true,
            appendTo: 'div[loadout-id="' + vm.store.id + '"]',
            overlay: false,
            className: 'loadout-popup',
            showClose: false,
            scope: scope
          });

          dialogResult.closePromise.then(function(data) {
            dialogResult = null;
          });
        }
      };

      vm.closeLoadoutPopup = function closeLoadoutPopup() {
        if (!_.isNull(dialogResult)) {
          dialogResult.close();
        }
      };

      element.addClass('character');

      if (vm.isGuardian) {
        element[0].querySelector('.character-box')
          .style.backgroundImage = 'url(' + vm.characterBoxUrl + ')';
        element[0].querySelector('.emblem')
          .style.backgroundImage = 'url(' + vm.emblemUrl + ')';

        if (vm.maxLevel) {
          element[0].querySelector('.level')
            .classList.add('maxLevel');
        }
      }
    }
  }

  StoreHeadingCtrl.$inject = [];

  function StoreHeadingCtrl() {
    var vm = this;

    vm.isGuardian = (vm.store.id !== 'vault');
    vm.class = vm.store.class;
    vm.level = vm.store.level;
    vm.race = vm.store.race;
    vm.gender = vm.store.gender;
    vm.isPrestigeLevel = vm.store.isPrestigeLevel;
    vm.percentToNextLevel = vm.store.percentToNextLevel;
    vm.maxLevel = (vm.store.level >= 20);
    vm.characterBoxUrl = 'http://bungie.net' + vm.store.background;
    vm.emblemUrl = 'http://bungie.net' + vm.store.icon;
  }
})();
