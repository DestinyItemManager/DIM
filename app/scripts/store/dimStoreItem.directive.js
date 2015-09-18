/*jshint -W027*/

(function() {
  'use strict';

  angular.module('dimApp')
    .directive('dimStoreItem', StoreItem);

  StoreItem.$inject = ['dimStoreService', 'ngDialog', 'dimLoadoutService'];

  function StoreItem(dimStoreService, ngDialog, dimLoadoutService) {
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
        '<div ui-draggable="{{ (vm.item.type !== \'Lost Items\') && (vm.item.type !== \'Missions\') && (vm.item.type !== \'Bounties\') && (vm.item.type !== \'Special Orders\') && (vm.item.type !== \'Messages\')  }}" id="item-{{:: $id }}" drag-channel="{{ (vm.item.notransfer) ? vm.item.owner + vm.item.type : vm.item.type }}" title="{{ vm.item.primStat.value }} {{ vm.item.name }}" alt="{{ vm.item.primStat.value }} {{ vm.item.name }}" drag="\'item-\' + $id" class="item" ng-class="{ \'search-hidden\': !vm.item.visible, \'search-item-hidden\': vm.item.visible === false && vm.hideFilteredItems === true, \'complete\': vm.item.complete }">',
        '  <div ui-draggable="false" class="img" ng-class="{ \'how\': vm.item.inHoW }" style="background-size: 44px 44px;" ng-click="vm.clicked(vm.item, $event)"></div>',
        '  <div ui-draggable="false" class="counter" ng-if="vm.item.amount > 1">{{ vm.item.amount }}</div>',
        '  <div ui-draggable="false" class="counter ng-binding ng-scope" ng-if="vm.item.type === \'Bounties\' && !vm.item.complete && vm.itemStat">{{vm.item.xpComplete}}%</div>',
        '  <div ui-draggable="false" class="damage-type" ng-if="!vm.itemStat && vm.item.sort === \'Weapons\'" ng-class="\'damage-\' + vm.item.dmg"></div>',
        '  <div ui-draggable="false" class="item-stat" ng-if="vm.itemStat && vm.item.primStat.value" ng-class="\'stat-damage-\' + vm.item.dmg">{{ vm.item.primStat.value }}</div>',
        '</div>'
      ].join('')
    };

    function Link(scope, element, attrs) {
      var vm = scope.vm;
      var dialogResult = null;

      $('<img/>').attr('src', 'http://www.bungie.net' + vm.item.icon).load(function() {
         $(this).remove(); // prevent memory leaks as @benweet suggested
        //  $('body').css('background-image', 'url(http://www.bungie.net' + vm.item.icon + ')');
        element[0].querySelector('.img')
          .style.backgroundImage = 'url(' + 'http://www.bungie.net' + vm.item.icon + ')';
      }).error(function() {
         $(this).remove(); // prevent memory leaks as @benweet suggested
        //  $('body').css('background-image', 'url(' + chrome.extension.getURL(vm.item.icon) + ')');
        element[0].querySelector('.img')
          .style.backgroundImage = 'url(' + chrome.extension.getURL(vm.item.icon) + ')';
      });

      // element[0].querySelector('.img')
      //   .style.backgroundImage = 'url(' + 'http://www.bungie.net' + vm.item.icon + ')';

      vm.clicked = function openPopup(item, e) {
        e.stopPropagation();

        if (!_.isNull(dialogResult)) {
          dialogResult.close();
        } else {
          ngDialog.closeAll();

          if (!dimLoadoutService.dialogOpen) {
            var bottom = ($(element).offset().top < 300) ? ' move-popup-bottom' : '';
            var right = ((($('body').width() - $(element).offset().left - 320) < 0) ? ' move-popup-right' : '');

            dialogResult = ngDialog.open({
              template: '<div ng-click="$event.stopPropagation();" dim-click-anywhere-but-here="vm.closePopup()" dim-move-popup dim-store="vm.store" dim-item="vm.item"></div>',
              plain: true,
              appendTo: 'div[id="item-' + scope.$id + '"]',
              overlay: false,
              className: 'move-popup' + right +  bottom,
              showClose: false,
              scope: scope
            });

            // if (($('body').width() - $(element).offset().left - 320) < 0) {
            //   $('.ngdialog.move-popup').css('left', $('body').width() - $(element).offset().left - 340);
            // }

            dialogResult.closePromise.then(function(data) {
              dialogResult = null;
            });
          } else {
            dimLoadoutService.addItemToLoadout(item);
          }
        }
      };

      vm.closePopup = function closePopup() {
        if (!_.isNull(dialogResult)) {
          dialogResult.close();
        }
      };
    }
  }

  StoreItemCtrl.$inject = ['$rootScope', 'dimSettingsService'];

  function StoreItemCtrl($rootScope, settings) {
    var vm = this;

    vm.hideFilteredItems = false;
    vm.itemStat = false;

    settings.getSetting('itemStat')
      .then(function(itemStat) {
        vm.itemStat = itemStat;
      });

    settings.getSetting('hideFilteredItems')
      .then(function(hideFilteredItems) {
        vm.hideFilteredItems = hideFilteredItems;
      });


    $rootScope.$on('dim-settings-updated', function(event, arg) {
      if (_.has(arg, 'hideFilteredItems')) {
        vm.hideFilteredItems = arg.hideFilteredItems;
      }

      if (_.has(arg, 'itemStat')) {
        vm.itemStat = arg.itemStat;
      }
    });

    vm.itemClicked = function clicked(item) {
      $rootScope.$broadcast('dim-store-item-clicked', {
        item: item
      });
    };
  }
})();
