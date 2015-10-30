/*jshint -W027*/

(function() {
  'use strict';

  angular.module('dimApp')
    .directive('dimStoreItem', StoreItem);

  StoreItem.$inject = ['dimStoreService', 'ngDialog', 'dimLoadoutService','dimSettingsService'];

  function StoreItem(dimStoreService, ngDialog, dimLoadoutService,dimSettingsService) {
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
        '  title="{{ vm.item.primStat.value + \' \' + vm.item.name }}" ',
        '  drag="::vm.item.index" ng-class="vm.itemClassNames">',
        '  <div ui-draggable="false" class="img" style="background-size: 44px 44px;" ng-click="vm.clicked(vm.item, $event)"></div>',
        '  <div ui-draggable="false" ng-class="vm.badgeClassNames" ng-if="vm.showBadge">{{ vm.badgeCount }}</div>',
        '</div>'
      ].join('')
    };

    function Link(scope, element, attrs) {
      var vm = scope.vm;
      var dialogResult = null;

      // var watchers;
      //
      // scope.$on('suspend', function() {
      //   watchers = scope.$$watchers;
      //   scope.$$watchers = [];
      // });
      //
      // scope.$on('resume', function() {
      //   if (watchers)
      //     scope.$$watchers = watchers;
      //
      //   // discard our copy of the watchers
      //   watchers = void 0;
      // });

      $('<img/>').attr('src', 'http://www.bungie.net' + vm.item.icon).load(function() {
        $(this).remove();
        element[0].querySelector('.img')
          .style.backgroundImage = 'url(' + 'http://www.bungie.net' + vm.item.icon + ')';
      }).error(function() {
        $(this).remove();
        element[0].querySelector('.img')
          .style.backgroundImage = 'url(' + chrome.extension.getURL(vm.item.icon) + ')';
      });

      vm.clicked = function openPopup(item, e) {
        function handleSettingsResult(settings){
          e.stopPropagation();

          if (!_.isNull(dialogResult)) {
            dialogResult.close();
          } else {
            ngDialog.closeAll();

            if (!dimLoadoutService.dialogOpen) {

              var verbosePerks = settings.verbosePerks,
                minOffset = 300 + (item.perks.length * 44 * verbosePerks),
                perkStateString = verbosePerks ? 'verbose-perks' :'quiet-perks',

                bottom = ($(element).offset().top < minOffset) ? ' move-popup-bottom' : '',
                right = ((($('body').width() - $(element).offset().left - 320) < 0) ? ' move-popup-right' : ''),
                templateString =
                  `
                    <div ng-click="$event.stopPropagation();"
                      class="${perkStateString}" dim-click-anywhere-but-here="vm.closePopup()"
                      dim-move-popup
                      dim-store="vm.store"
                      dim-item="vm.item">
                    </div>
                  `;

              dialogResult = ngDialog.open({
                template: templateString,
                plain: true,
                appendTo: 'div[id="' + item.index + '"]',
                overlay: false,
                className: 'move-popup' + right + bottom,
                showClose: false,
                scope: scope
              });

              dialogResult.closePromise.then(function(data) {
                dialogResult = null;
              });
            } else {
              dimLoadoutService.addItemToLoadout(item);
            }
          }

        }
        dimSettingsService.getSettings().then(handleSettingsResult);
      };

      vm.closePopup = function closePopup() {
        if (!_.isNull(dialogResult)) {
          dialogResult.close();
        }
      };

      scope.$watch(function() {
        return vm.dragChannel + ((vm.item.primStat) ? vm.item.primStat.value : 0) + vm.item.name +
          vm.showBadge + vm.badgeCount + vm.hideFilteredItems + vm.itemStat + vm.item.visible + vm.item.complete +
          vm.maxStackSize + vm.item.owner + vm.item.type + vm.item.sort + vm.item.amount + vm.item.xpComplete;
      }, function(newItem) {
        processItem(vm, vm.item);
      });
    }
  }

  function processSettings(vm, settings) {
    if (_.has(settings, 'hideFilteredItems')) {
      vm.hideFilteredItems = settings.hideFilteredItems;
    }

    if (_.has(settings, 'itemStat')) {
      vm.itemStat = settings.itemStat;
    }
  }

  function processItem(vm, item) {
    switch (item.type) {
      case 'Lost Items':
      case 'Missions':
      case 'Bounties':
      case 'Special Orders':
      case 'Messages':
        {
          vm.draggable = false;
          break;
        }
      default:
        vm.draggable = true;
    }

    vm.itemClassNames = {
      'item': true,
      'search-hidden': !item.visible,
      'search-item-hidden': item.visible === false && vm.hideFilteredItems === true,
      'complete': item.complete
    }

    vm.badgeClassNames = {
      'counter': false,
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
    }

    vm.dragChannel = (item.notransfer) ? item.owner + item.type : item.type;
    vm.stackable = item.maxStackSize > 1;
    vm.showBountyPercentage = ((item.type === 'Bounties') && (!item.complete) && (vm.itemStat));
    vm.showStats = vm.itemStat && item.primStat && item.primStat.value;
    vm.showDamageType = !vm.itemStat && (vm.item.sort === 'Weapons');
    vm.showBadge = (vm.stackable || vm.showBountyPercentage || vm.showStats || vm.showDamageType);

    if (vm.stackable) {
      vm.badgeClassNames['counter'] = true;
      vm.badgeCount = item.amount;
    } else if (vm.showBountyPercentage) {
      vm.badgeClassNames['counter'] = true;
      vm.badgeCount = item.xpComplete + '%';
    } else if (vm.showStats) {
      vm.badgeClassNames['item-stat'] = true;
      vm.badgeClassNames['stat-damage-' + item.dmg] = true;
      vm.badgeCount = item.primStat.value;
    } else if (vm.showDamageType) {
      vm.badgeClassNames['damage-' + item.dmg] = true;
      vm.badgeClassNames['damage-type'] = true;
      vm.badgeCount = '';
    }
  }

  StoreItemCtrl.$inject = ['$rootScope', 'dimSettingsService', '$scope'];

  function StoreItemCtrl($rootScope, settings, $scope) {
    var vm = this;

    vm.hideFilteredItems = false;
    vm.itemStat = false;

    processItem(vm, vm.item);

    settings.getSettings()
      .then(function(settings) {
        processSettings(vm, settings);
        //processItem(vm, vm.item);
      });

    $rootScope.$on('dim-settings-updated', function(event, arg) {
      processSettings(vm, arg);
      //processItem(vm, vm.item);
    });

    vm.itemClicked = function clicked(item) {
      $rootScope.$broadcast('dim-store-item-clicked', {
        item: item
      });
    };
  }
})();
