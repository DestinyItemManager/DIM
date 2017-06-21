import angular from 'angular';
import _ from 'underscore';
import template from './dimStoreBucket.directive.html';
import dialogTemplate from './dimStoreBucket.directive.dialog.html';

angular.module('dimApp')
  .directive('dimStoreBucket', StoreBucket);

function StoreBucket() {
  return {
    controller: StoreBucketCtrl,
    controllerAs: 'vm',
    bindToController: true,
    replace: true,
    restrict: 'E',
    scope: {
      store: '=storeData',
      items: '=bucketItems',
      bucket: '=bucket'
    },
    template: template
  };
}

function StoreBucketCtrl($scope,
                         loadingTracker,
                         dimStoreService,
                         dimItemService,
                         $q,
                         $timeout,
                         toaster,
                         dimSettingsService,
                         ngDialog,
                         $rootScope,
                         dimActionQueue,
                         dimInfoService,
                         $translate) {
  var vm = this;

  vm.settings = dimSettingsService;

  vm.dropChannel = vm.bucket.type + ',' + vm.store.id + vm.bucket.type;

  // Detect when we're hovering a dragged item over a target
  var dragTimer = null;
  var hovering = false;
  var dragHelp = document.getElementById('drag-help');
  var entered = 0;
  vm.onDragEnter = function() {
    if ($rootScope.dragItem && $rootScope.dragItem.owner !== vm.store.id) {
      entered = entered + 1;
      if (entered === 1) {
        dragTimer = $timeout(function() {
          if ($rootScope.dragItem) {
            hovering = true;
            dragHelp.classList.add('drag-dwell-activated');
          }
        }, 1000);
      }
    }
  };
  vm.onDragLeave = function() {
    if ($rootScope.dragItem && $rootScope.dragItem.owner !== vm.store.id) {
      entered = entered - 1;
      if (entered === 0) {
        hovering = false;
        dragHelp.classList.remove('drag-dwell-activated');
        $timeout.cancel(dragTimer);
      }
    }
  };
  vm.onDrop = function(id, $event, equip) {
    vm.moveDroppedItem(angular.element('#' + id).scope().item, equip, $event, hovering);
    hovering = false;
    dragHelp.classList.remove('drag-dwell-activated');
    $timeout.cancel(dragTimer);
  };
  const didYouKnowTemplate = `<p>${$translate.instant('DidYouKnow.DoubleClick')}</p>
                              <p>${$translate.instant('DidYouKnow.TryNext')}</p>`;
  // Only show this once per session
  const didYouKnow = _.once(() => {
    dimInfoService.show('doubleclick', {
      title: $translate.instant('DidYouKnow'),
      body: didYouKnowTemplate,
      hide: $translate.instant('DidYouKnow.DontShowAgain')
    });
  });

  vm.moveDroppedItem = dimActionQueue.wrap(function(item, equip, $event, hovering) {
    var target = vm.store;

    if (target.current && equip) {
      didYouKnow();
    }

    if (item.notransfer && item.owner !== target.id) {
      return $q.reject(new Error($translate.instant('Help.CannotMove')));
    }

    if (item.owner === vm.store.id) {
      if ((item.equipped && equip) || (!item.equipped && !equip)) {
        return $q.resolve(item);
      }
    }

    var promise = $q.when(item.amount);

    if (item.maxStackSize > 1 && item.amount > 1 && ($event.shiftKey || hovering)) {
      ngDialog.closeAll();
      var dialogResult = ngDialog.open({
        // TODO: break this out into a separate service/directive?
        template: dialogTemplate,
        scope: $scope,
        controllerAs: 'vm',
        controller: function($scope) {
          'ngInject';
          var vm = this;
          vm.item = $scope.ngDialogData;
          vm.moveAmount = vm.item.amount;
          vm.maximum = dimStoreService.getStore(vm.item.owner).amountOfItem(item);
          vm.stacksWorth = Math.min(Math.max(item.maxStackSize - target.amountOfItem(item), 0), vm.maximum);
          vm.stacksWorthClick = function() {
            vm.moveAmount = vm.stacksWorth;
            vm.finish();
          };
          vm.finish = function() {
            $scope.closeThisDialog(vm.moveAmount);
          };
        },
        plain: true,
        data: item,
        appendTo: 'body',
        overlay: true,
        className: 'move-amount-popup',
        appendClassName: 'modal-dialog'
      });

      promise = dialogResult.closePromise.then(function(data) {
        if (typeof data.value === 'string') {
          const error = new Error("move-canceled");
          error.code = "move-canceled";
          return $q.reject(error);
        }
        var moveAmount = data.value;
        return moveAmount;
      });
    }

    promise = promise.then(function(moveAmount) {
      if ($featureFlags.debugMoves) {
        console.log("User initiated move:", moveAmount, item.name, item.type, 'to', target.name, 'from', dimStoreService.getStore(item.owner).name);
      }
      var movePromise = dimItemService.moveTo(item, target, equip, moveAmount);

      var reload = item.equipped || equip;
      if (reload) {
        movePromise = movePromise.then(function() {
          return dimStoreService.updateCharacters();
        });
      }
      return movePromise;
    }).catch(function(e) {
      if (e.message !== 'move-canceled') {
        toaster.pop('error', item.name, e.message);
      }
    });

    loadingTracker.addPromise(promise);

    return promise;
  });
}
