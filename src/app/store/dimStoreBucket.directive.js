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
                         $i18next) {
  const vm = this;

  vm.settings = dimSettingsService;

  vm.dropChannel = `${vm.bucket.type},${vm.store.id}${vm.bucket.type}`;

  // Detect when we're hovering a dragged item over a target
  let dragTimer = null;
  let hovering = false;
  const dragHelp = document.getElementById('drag-help');
  let entered = 0;
  vm.onDragEnter = function() {
    if ($rootScope.dragItem && $rootScope.dragItem.owner !== vm.store.id) {
      entered = entered + 1;
      if (entered === 1) {
        dragTimer = $timeout(() => {
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
    vm.moveDroppedItem(angular.element(document.getElementById(id)).scope().item, equip, $event, hovering);
    hovering = false;
    dragHelp.classList.remove('drag-dwell-activated');
    $timeout.cancel(dragTimer);
  };
  const didYouKnowTemplate = `<p>${$i18next.t('DidYouKnow.DoubleClick')}</p>
                              <p>${$i18next.t('DidYouKnow.TryNext')}</p>`;
  // Only show this once per session
  const didYouKnow = _.once(() => {
    dimInfoService.show('doubleclick', {
      title: $i18next.t('DidYouKnow.DidYouKnow'),
      body: didYouKnowTemplate,
      hide: $i18next.t('DidYouKnow.DontShowAgain')
    });
  });

  vm.moveDroppedItem = dimActionQueue.wrap((item, equip, $event, hovering) => {
    const target = vm.store;

    if (target.current && equip) {
      didYouKnow();
    }

    if (item.notransfer && item.owner !== target.id) {
      return $q.reject(new Error($i18next.t('Help.CannotMove')));
    }

    if (item.owner === vm.store.id) {
      if ((item.equipped && equip) || (!item.equipped && !equip)) {
        return $q.resolve(item);
      }
    }

    let promise = $q.when(item.amount);

    if (item.maxStackSize > 1 && item.amount > 1 && ($event.shiftKey || hovering)) {
      ngDialog.closeAll();
      const dialogResult = ngDialog.open({
        // TODO: break this out into a separate service/directive?
        template: dialogTemplate,
        scope: $scope,
        controllerAs: 'vm',
        controller: function($scope) {
          'ngInject';
          const vm = this;
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

      promise = dialogResult.closePromise.then((data) => {
        if (typeof data.value === 'string') {
          const error = new Error("move-canceled");
          error.code = "move-canceled";
          return $q.reject(error);
        }
        const moveAmount = data.value;
        return moveAmount;
      });
    }

    promise = promise.then((moveAmount) => {
      if ($featureFlags.debugMoves) {
        console.log("User initiated move:", moveAmount, item.name, item.type, 'to', target.name, 'from', dimStoreService.getStore(item.owner).name);
      }
      let movePromise = dimItemService.moveTo(item, target, equip, moveAmount);

      const reload = item.equipped || equip;
      if (reload) {
        movePromise = movePromise.then(() => {
          return dimStoreService.updateCharacters();
        });
      }
      return movePromise;
    }).catch((e) => {
      if (e.message !== 'move-canceled') {
        toaster.pop('error', item.name, e.message);
      }
    });

    loadingTracker.addPromise(promise);

    return promise;
  });
}
