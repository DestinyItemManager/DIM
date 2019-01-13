import * as React from 'react';
import { DimItem } from '../inventory/item-types';
import { t } from 'i18next';
import { percent } from '../inventory/dimPercentWidth.directive';
import { settings } from '../settings/settings';
import ItemOverview from './ItemDetails';
import { ItemPopupExtraInfo } from './item-popup';
import ItemActions from './ItemActions';
import classNames from 'classnames';
import { ItemReviewComponent } from '../item-review/item-review.component';
import { angular2react } from 'angular2react';
import { lazyInjector } from '../../lazyInjector';

const OldItemReviews = angular2react<{
  item: DimItem;
}>('dimItemReview', ItemReviewComponent, lazyInjector.$injector as angular.auto.IInjectorService);

export enum ItemPopupTab {
  Overview,
  Reviews
}

/** The main portion of the item popup, with pages of info (Actions, Details, Reviews) */
export default function ItemPopupBody({
  item,
  failureStrings,
  extraInfo,
  tab,
  onTabChanged
}: {
  item: DimItem;
  failureStrings?: string[];
  extraInfo?: ItemPopupExtraInfo;
  tab: ItemPopupTab;
  onTabChanged(tab: ItemPopupTab): void;
}) {
  failureStrings = Array.from(failureStrings || []);
  if (!item.canPullFromPostmaster && item.location.inPostmaster) {
    failureStrings.push(t('MovePopup.CantPullFromPostmaster'));
  }

  const showDetailsByDefault = !item.equipment && item.notransfer;
  // TODO: ugh
  const itemDetails = showDetailsByDefault || settings.itemDetails;

  return (
    <div>
      {/* TODO: Should these be in the details? Or in the header? */}
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
      <div className="move-popup-details">
        {itemDetails && (
          <>
            {/* TODO: Should tabs be in the header? */}
            {item.reviewable && (
              <div className="move-popup-tabs">
                <span
                  className={classNames('move-popup-tab', {
                    selected: tab === ItemPopupTab.Overview
                  })}
                  onClick={() => onTabChanged(ItemPopupTab.Overview)}
                >
                  {t('MovePopup.OverviewTab')}
                </span>
                <span
                  className={classNames('move-popup-tab', {
                    selected: tab === ItemPopupTab.Reviews
                  })}
                  onClick={() => onTabChanged(ItemPopupTab.Reviews)}
                >
                  {t('MovePopup.ReviewsTab')}
                </span>
              </div>
            )}
            {tab === ItemPopupTab.Overview && <ItemOverview item={item} extraInfo={extraInfo} />}
            {tab === ItemPopupTab.Reviews && <OldItemReviews item={item} key={item.id} />}
          </>
        )}
        <ItemActions item={item} />
      </div>
    </div>
  );
}
