/*jshint -W027*/

(function() {
  'use strict';

  angular.module('dimApp')
    .directive('dimStoreItem', StoreItem)
    // A filter that will heatmap-color a background according to a percentage
    .filter('qualityColor', function() {
      return function getColor(value, property) {
        property = property || 'background-color';
        var color = 0;
        if (value <= 85) {
          color = 0;
        } else if (value <= 90) {
          color = 20;
        } else if (value <= 95) {
          color = 60;
        } else if (value <= 99) {
          color = 120;
        } else if (value >= 100) {
          color = 190;
        } else {
          return 'white';
        }
        var result = {};
        result[property] = 'hsl(' + color + ',85%,60%)';
        return result;
      };
    });



  StoreItem.$inject = ['dimStoreService', 'ngDialog', 'dimLoadoutService', '$rootScope'];

  function StoreItem(dimStoreService, ngDialog, dimLoadoutService, $rootScope) {
    return {
      bindToController: true,
      controller: StoreItemCtrl,
      controllerAs: 'vm',
      link: Link,
      replace: true,
      restrict: 'E',
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
        '    <div class="item-xp-bar item-xp-bar-small" ng-if="vm.item.percentComplete && !vm.item.complete">',
        '      <div dim-percent-width="vm.item.percentComplete"></div>',
        '    </div>',
        '    <div class="img" dim-bungie-image-fallback="::vm.item.icon" ng-click="vm.clicked(vm.item, $event)">',
        '    <div ng-if="vm.item.quality" class="item-stat item-quality" ng-style="vm.item.quality.min | qualityColor">{{ vm.item.quality.min }}%</div>',
        '    <img class="element" ng-if=":: vm.item.dmg && vm.item.dmg !== \'kinetic\'" ng-src="/images/{{::vm.item.dmg}}.png"/>',
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

      vm.badgeClassNames = {};

      if (!vm.item.primStat && vm.item.objectives) {
        scope.$watchGroup([
          'vm.item.percentComplete',
          'vm.item.complete'], function() {
            processBounty(vm, vm.item);
          });
      } else if (vm.item.maxStackSize > 1) {
        scope.$watchGroup([
          'vm.item.amount'], function() {
            processStackable(vm, vm.item);
          });
      } else {
        scope.$watch('vm.item.primStat.value', function() {
          processItem(vm, vm.item);
        });
      }

      scope.$watch('vm.item.quality', function() {
        vm.badgeClassNames['item-stat-no-bg'] = (vm.item.quality && vm.item.quality.min > 0);
      });
    }
  }

  function processBounty(vm, item) {
    var showBountyPercentage = !item.complete;
    vm.showBadge = showBountyPercentage;

    if (showBountyPercentage) {
      vm.badgeClassNames = { 'item-stat': true, 'item-bounty': true };
      vm.badgeCount = Math.floor(100.0 * item.percentComplete) + '%';
    }
  }

  function processStackable(vm, item) {
    vm.showBadge = true;
    vm.badgeClassNames = { 'item-stat': true, 'item-stackable': true };
    vm.badgeCount = item.amount;
  }

  function processItem(vm, item) {
    vm.badgeClassNames = {
      'item-equipment': true
    };

    vm.showBadge = item.primStat && item.primStat.value;

    if (vm.showBadge) {
      vm.badgeClassNames['item-stat'] = true;

      vm.badgeClassNames['stat-damage-' + item.dmg] = true;
      vm.badgeCount = item.primStat.value;
    }
  }

  StoreItemCtrl.$inject = ['$rootScope', 'dimSettingsService', '$scope'];

  function StoreItemCtrl($rootScope, settings, $scope) {
    var vm = this;

    vm.dragChannel = (vm.item.notransfer) ? vm.item.owner + vm.item.location.type : vm.item.location.type;
    vm.draggable = vm.item.location.hasTransferDestination;
  }
})();
