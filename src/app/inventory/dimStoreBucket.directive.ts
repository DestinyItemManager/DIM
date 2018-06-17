import { IComponentOptions, IController, IScope, IQService, ITimeoutService, IRootScopeService, IPromise, element } from 'angular';
import * as _ from 'underscore';
import { reportException } from '../exceptions';
import { isPhonePortrait } from '../mediaQueries';
import { queuedAction } from '../inventory/action-queue';
import { settings } from '../settings/settings';
import { showInfoPopup } from '../shell/info-popup';
import dialogTemplate from './dimStoreBucket.directive.dialog.html';
import template from './dimStoreBucket.directive.html';
import './dimStoreBucket.scss';
import { ItemServiceType } from './dimItemService.factory';
import { DimError } from '../bungie-api/bungie-service-helper';
import { DimStore } from './store-types';
import { DimItem } from './item-types';
import { InventoryBucket } from './inventory-buckets';

export const StoreBucketComponent: IComponentOptions = {
  controller: StoreBucketCtrl,
  controllerAs: 'vm',
  bindings: {
    store: '<storeData',
    items: '<bucketItems',
    bucket: '<bucket'
  },
  template
};

function StoreBucketCtrl(
  this: IController & {
    store: DimStore;
    items: DimItem[];
    bucket: InventoryBucket;
  },
  $scope: IScope,
  loadingTracker,
  dimItemService: ItemServiceType,
  $q: IQService,
  $timeout: ITimeoutService,
  toaster,
  ngDialog,
  $rootScope: IRootScopeService & { dragItem: DimItem },
  $i18next
) {
  "ngInject";
  const vm = this;

  vm.settings = settings;

  vm.$onInit = () => {
    vm.dropChannel = `${vm.bucket.type},${vm.store.id}${vm.bucket.type}`;
  };

  // Detect when we're hovering a dragged item over a target
  let dragTimer: IPromise<void> | undefined;
  let hovering = false;
  const dragHelp = document.getElementById("drag-help")!;
  let entered = 0;
  vm.onDragEnter = () => {
    if ($rootScope.dragItem && $rootScope.dragItem.owner !== vm.store.id) {
      entered = entered + 1;
      if (entered === 1) {
        dragTimer = $timeout(() => {
          if ($rootScope.dragItem) {
            hovering = true;
            dragHelp.classList.add("drag-dwell-activated");
          }
        }, 1000);
      }
    }
  };
  vm.onDragLeave = () => {
    if ($rootScope.dragItem && $rootScope.dragItem.owner !== vm.store.id) {
      entered = entered - 1;
      if (entered === 0) {
        hovering = false;
        dragHelp.classList.remove("drag-dwell-activated");
        $timeout.cancel(dragTimer);
      }
    }
  };
  vm.onDrop = (id, $event, equip) => {
    vm.moveDroppedItem(
      (element(document.getElementById(id)!).scope() as any).vm.item,
      equip,
      $event,
      hovering
    );
    entered = entered - 1;
    hovering = false;
    dragHelp.classList.remove("drag-dwell-activated");
    $timeout.cancel(dragTimer);
  };
  const didYouKnowTemplate = `<p>${$i18next.t("DidYouKnow.DoubleClick")}</p>
                              <p>${$i18next.t("DidYouKnow.TryNext")}</p>`;
  // Only show this once per session
  const didYouKnow = _.once(() => {
    showInfoPopup("doubleclick", {
      title: $i18next.t("DidYouKnow.DidYouKnow"),
      body: didYouKnowTemplate,
      hide: $i18next.t("DidYouKnow.DontShowAgain")
    });
  });

  vm.moveDroppedItem = queuedAction((item: DimItem, equip: boolean, $event, hovering: boolean) => {
    const target = vm.store;

    if (target.current && equip && !isPhonePortrait()) {
      didYouKnow();
    }

    if (item.notransfer && item.owner !== target.id) {
      return $q.reject(new Error($i18next.t("Help.CannotMove")));
    }

    if (item.owner === vm.store.id && !item.location.inPostmaster) {
      if ((item.equipped && equip) || (!item.equipped && !equip)) {
        return $q.resolve(item);
      }
    }

    let promise: IPromise<any> = $q.when(item.amount);

    if (
      item.maxStackSize > 1 &&
      item.amount > 1 &&
      ($event.shiftKey || hovering)
    ) {
      ngDialog.closeAll();
      const dialogResult = ngDialog.open({
        // TODO: break this out into a separate service/directive?
        template: dialogTemplate,
        scope: $scope,
        controllerAs: "vm",
        controller($scope) {
          "ngInject";
          const vm = this;
          vm.item = $scope.ngDialogData;
          vm.moveAmount = vm.item.amount;
          vm.maximum = vm.item.getStoresService()
            .getStore(vm.item.owner)!
            .amountOfItem(item);
          vm.stacksWorth = Math.min(
            Math.max(item.maxStackSize - target.amountOfItem(item), 0),
            vm.maximum
          );
          vm.stacksWorthClick = () => {
            vm.moveAmount = vm.stacksWorth;
            vm.finish();
          };
          vm.finish = () => {
            $scope.closeThisDialog(vm.moveAmount);
          };
        },
        plain: true,
        data: item,
        appendTo: "body",
        overlay: true,
        className: "move-amount-popup",
        appendClassName: "modal-dialog"
      });

      promise = dialogResult.closePromise.then((data) => {
        if (typeof data.value === "string") {
          const error: DimError = new Error("move-canceled");
          error.code = "move-canceled";
          return $q.reject(error);
        }
        const moveAmount = data.value;
        return moveAmount;
      });
    }

    promise = promise
      .then((moveAmount) => {
        if ($featureFlags.debugMoves) {
          console.log(
            "User initiated move:",
            moveAmount,
            item.name,
            item.type,
            "to",
            target.name,
            "from",
            item.getStoresService().getStore(item.owner)!.name
          );
        }
        let movePromise = dimItemService.moveTo(
          item,
          target,
          equip,
          moveAmount
        );

        const reload = item.equipped || equip;
        if (reload) {
          movePromise = movePromise.then((item) => {
            return item.getStoresService()
              .updateCharacters()
              .then(() => item);
          });
        }
        return movePromise.then((item) => {
          item.updateManualMoveTimestamp();
        });
      })
      .catch((e) => {
        if (e.message !== "move-canceled") {
          toaster.pop("error", item.name, e.message);
          console.error("error moving", e, item);
          // Some errors aren't worth reporting
          if (
            e.code !== "wrong-level" &&
            e.code !== "no-space" &&
            e.code !==
              1671 /* PlatformErrorCodes.DestinyCannotPerformActionAtThisLocation */
          ) {
            reportException("moveItem", e);
          }
        }
      });

    loadingTracker.addPromise(promise);

    return promise;
  });
}
