import * as React from 'react';
import { DimItem } from '../inventory/item-types';
import { t } from 'i18next';
import { percent } from '../inventory/dimPercentWidth.directive';
import { settings } from '../settings/settings';
import ItemOverview from './ItemDetails';
import { ItemPopupExtraInfo } from './item-popup';
import ItemActions from './ItemActions';

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

  // TODO: handle this
  const amount = item.amount;

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

          <ItemActions item={item} amount={amount} />
        </div>
      )}
    </div>
  );
}
