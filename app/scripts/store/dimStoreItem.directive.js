/*jshint -W027*/

(function() {
  'use strict';

  angular.module('dimApp')
    .directive('dimStoreItem', StoreItem);

  StoreItem.$inject = ['dimStoreService', 'ngDialog', 'dimLoadoutService', '$rootScope'];

  function StoreItem(dimStoreService, ngDialog, dimLoadoutService, $rootScope) {
    return {
      bindToController: true,
      controller: StoreItemCtrl,
      controllerAs: 'vm',
      link: Link,
      replace: true,
      scope: {
        'store': '=storeData',
        'item': '=itemData'
      },
      template: [
        '<div ui-draggable="{{ ::vm.draggable }}" id="{{ ::vm.item.index }}" drag-channel="{{ ::vm.dragChannel }}" ',
        '  title="{{vm.item.primStat.value}} {{::vm.item.name}}" ',
        '  drag="::vm.item.index"',
        '  class="item">',
        '  <div class="item-elem" ng-class="{',
        "    'search-hidden': !vm.item.visible,",
        "    'complete': vm.item.complete",
        '  }">',
        '    <div class="img" dim-bungie-image-fallback="::vm.item.icon" ng-click="vm.clicked(vm.item, $event)">',
        '    <div ng-class="vm.badgeClassNames" ng-if="vm.showBadge">{{ vm.badgeCount }}</div>',
        '  </div>',
        '</div>'
      ].join('')
    };

    var otherDialog = null;

    function Link(scope, element, attrs) {
      var vm = scope.vm;
      var dialogResult = null;

      var dragHelp = document.getElementById('drag-help');

      if (vm.item.maxStackSize > 1) {
        element.on('dragstart', function(e) {
          $rootScope.dragItem = vm.item; // Kind of a hack to communicate currently-dragged item
          if (vm.item.amount > 1) {
            dragHelp.classList.remove('drag-help-hidden');
          }
        });
        element.on('dragend', function() {
          dragHelp.classList.add('drag-help-hidden');
          delete $rootScope.dragItem;
        });
        element.on('drag', function(e) {
          if (e.shiftKey) {
            dragHelp.classList.add('drag-shift-activated');
          } else {
            dragHelp.classList.remove('drag-shift-activated');
          }
        });
      }

      vm.clicked = function openPopup(item, e) {
        e.stopPropagation();

        if (otherDialog) {
          if (ngDialog.isOpen(otherDialog.id)) {
            otherDialog.close();
          }
          otherDialog = null;
        }

        if (dialogResult) {
          if (ngDialog.isOpen(dialogResult.id)) {
            dialogResult.close();
            dialogResult = null;
          }
        } else {
          if (!dimLoadoutService.dialogOpen) {
            var bottom = ($(element).offset().top < 400) ? ' move-popup-bottom' : '';
            var right = ((($('body').width() - $(element).offset().left - 320) < 0) ? ' move-popup-right' : '');

            dialogResult = ngDialog.open({
              template: '<div ng-click="$event.stopPropagation();" dim-click-anywhere-but-here="vm.closePopup()" dim-move-popup dim-store="vm.store" dim-item="vm.item"></div>',
              plain: true,
              appendTo: 'div[id="' + item.index + '"]',
              overlay: false,
              className: 'move-popup' + right + bottom,
              showClose: false,
              scope: scope
            });
            otherDialog = dialogResult;

            dialogResult.closePromise.then(function(data) {
              dialogResult = null;
            });
          } else {
            dimLoadoutService.addItemToLoadout(item, e);
          }
        }
      };

      vm.closePopup = function closePopup() {
        if (!_.isNull(dialogResult)) {
          dialogResult.close();
        }
      };

      if (!vm.item.primStat && vm.item.objectives) {
        scope.$watchGroup([
          'vm.item.xpComplete',
          'vm.itemStat',
          'vm.item.complete'], function() {
            processBounty(vm, vm.item);
          });
      } else if (vm.item.maxStackSize > 1) {
        scope.$watchGroup([
          'vm.item.amount'], function() {
            processStackable(vm, vm.item);
          });
      } else {
        scope.$watchGroup([
          'vm.item.primStat.value',
          'vm.itemStat',
          'vm.item.sort'], function() {
            processItem(vm, vm.item);
          });
      }
    }
  }

  function processSettings(vm, settings) {
    if (_.has(settings, 'itemStat')) {
      vm.itemStat = settings.itemStat;
    }
  }

  function processBounty(vm, item) {
    var showBountyPercentage = !item.complete && vm.itemStat;
    vm.showBadge = showBountyPercentage;

    if (showBountyPercentage) {
      vm.badgeClassNames = { 'item-stat': true };
      vm.badgeCount = item.xpComplete + '%';
    }
  }

  function processStackable(vm, item) {
    vm.showBadge = true;
    vm.badgeClassNames = { 'item-stat': true };
    vm.badgeCount = item.amount;
  }

  function processItem(vm, item) {
    vm.badgeClassNames = {
      'damage-type': false,
      'damage-solar': false,
      'damage-arc': false,
      'damage-void': false,
      'damage-kinetic': false,
      'item-stat': false,
      'stat-damage-solar': false,
      'stat-damage-arc': false,
      'stat-damage-void': false,
      'stat-damage-kinetic': false
    };

    var showStats = vm.itemStat && item.primStat && item.primStat.value;
    var showDamageType = !vm.itemStat && vm.item.sort === 'Weapons';
    vm.showBadge = (showStats || showDamageType);

    if (showStats) {
      vm.badgeClassNames['item-stat'] = true;
      vm.badgeClassNames['stat-damage-' + item.dmg] = true;
      vm.badgeCount = item.primStat.value;
    } else if (showDamageType) {
      vm.badgeClassNames['damage-' + item.dmg] = true;
      vm.badgeClassNames['damage-type'] = true;
      vm.badgeCount = '';
    }
  }

  StoreItemCtrl.$inject = ['$rootScope', 'dimSettingsService', '$scope'];

  function StoreItemCtrl($rootScope, settings, $scope) {
    var vm = this;

    vm.itemStat = false;
    vm.dragChannel = (vm.item.notransfer) ? vm.item.owner + vm.item.type : vm.item.type;
    switch (vm.item.type) {
    case 'Lost Items':
    case 'Missions':
    case 'Bounties':
    case 'Quests':
    case 'Special Orders':
    case 'Messages':
      {
        vm.draggable = false;
        break;
      }
    default:
      vm.draggable = true;
    }

    settings.getSettings()
      .then(function(settings) {
        processSettings(vm, settings);
      });

    $rootScope.$on('dim-settings-updated', function(event, arg) {
      processSettings(vm, arg);
    });
  }
})();
