import * as React from 'react';
import { DimItem } from '../inventory/item-types';
import { t } from 'i18next';
import { percent } from '../inventory/dimPercentWidth.directive';
import { settings } from '../settings/settings';
import ItemOverview from './ItemDetails';
import { ItemPopupExtraInfo } from './item-popup';

export default function ItemPopupBody({
  item,
  failureStrings,
  extraInfo
}: {
  item: DimItem;
  failureStrings?: string[];
  extraInfo?: ItemPopupExtraInfo;
}) {
  failureStrings = Array.from(failureStrings || []);
  if (!item.canPullFromPostmaster && item.location.inPostmaster) {
    failureStrings.push(t('MovePopup.CantPullFromPostmaster'));
  }

  const showDetailsByDefault = !item.equipment && item.notransfer;
  // TODO: ugh
  const itemDetails = showDetailsByDefault || settings.itemDetails;

  // TODO: pager!
  // TODO: remember page
  // let tab: 'default' | 'reviews' = 'default';
  // const setTab = (t) => (tab = t);

  return (
    <div>
      {item.percentComplete !== null && !item.complete && (
        <div className="item-xp-bar" style={{ width: percent(item.percentComplete) }} />
      )}

      {failureStrings.map(
        (failureString) =>
          failureString.length > 0 && (
            <div className="item-details failure-reason" key={failureString}>
              {failureString}
            </div>
          )
      )}
      {itemDetails && (
        <div className="move-popup-details">
          {/*
          {item.reviewable && (
            <div className="move-popup-tabs">
              <span
                className={classNames('move-popup-tab', { selected: tab === 'default' })}
                onClick={() => setTab('default')}
              >
                {t('MovePopup.OverviewTab')}
              </span>
              <span
                className={classNames('move-popup-tab', { selected: tab === 'reviews' })}
                onClick={() => setTab('reviews')}
              >
                {t('MovePopup.ReviewsTab')}
              </span>
            </div>
          )} */}
          {/*tab === 'default' && <ItemOverview item={item} />*/}
          {/*{tab === 'reviews' && <ItemReviews item={item} />}*/}
          {/*{tab === 'actions' && <ItemActions item={item} />}*/}
          <ItemOverview item={item} extraInfo={extraInfo} />

          {/*
          <dim-move-amount
            ng-if="vm.maximum > 1 && !vm.item.notransfer && !vm.item.uniqueStack"
            amount="vm.moveAmount"
            maximum="vm.maximum"
            max-stack-size="vm.item.maxStackSize"
          ></dim-move-amount>
          <div className="interaction" ng-if="vm.store">
            <dim-move-locations item="vm.item" amount="vm.moveAmount"></dim-move-locations>
            <div
              className="move-button move-consolidate"
              ng-i18next="[title]MovePopup.Consolidate;[alt]MovePopup.Consolidate"
              ng-if="!vm.item.notransfer && vm.item.location.hasTransferDestination && vm.item.maxStackSize > 1"
              ng-click="vm.consolidate()"
            >
              <span ng-i18next="MovePopup.Take"></span>
            </div>
            <div
              className="move-button move-distribute"
              ng-i18next="[title]MovePopup.DistributeEvenly;[alt]MovePopup.DistributeEvenly"
              ng-if="vm.item.destinyVersion === 1 && !vm.item.notransfer && vm.item.maxStackSize > 1"
              ng-click="vm.distribute()"
            >
              <span ng-i18next="MovePopup.Split"></span>
            </div>
            <div className="locations" ng-if="vm.item.infusionFuel">
              <div
                className="move-button infuse-perk"
                ng-className="[{ destiny2: vm.item.destinyVersion === 2}, vm.item.bucket.sort]"
                ng-click="vm.infuse(vm.item, $event)"
                ng-i18next="[title]Infusion.Infusion;[alt]Infusion.Calc"
              >
                <span ng-i18next="MovePopup.Infuse"></span>
              </div>
            </div>
          </div> */}
        </div>
      )}
    </div>
  );
}
