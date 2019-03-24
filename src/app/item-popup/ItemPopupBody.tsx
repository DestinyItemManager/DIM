import React from 'react';
import { DimItem } from '../inventory/item-types';
import { t } from 'i18next';
import ItemOverview from './ItemDetails';
import { ItemPopupExtraInfo } from './item-popup';
import ItemActions from './ItemActions';
import classNames from 'classnames';
import ItemReviews from '../item-review/ItemReviews';
import { percent } from '../shell/filters';
import { AppIcon } from '../shell/icons';
import { faChevronCircleDown } from '@fortawesome/free-solid-svg-icons';

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
  expanded,
  onTabChanged,
  onToggleExpanded
}: {
  item: DimItem;
  failureStrings?: string[];
  extraInfo?: ItemPopupExtraInfo;
  tab: ItemPopupTab;
  expanded: boolean;
  onTabChanged(tab: ItemPopupTab): void;
  onToggleExpanded(): void;
}) {
  failureStrings = Array.from(failureStrings || []);
  if (!item.canPullFromPostmaster && item.location.inPostmaster) {
    failureStrings.push(t('MovePopup.CantPullFromPostmaster'));
  }

  const showDetailsByDefault = !item.equipment && item.notransfer;
  const itemDetails = showDetailsByDefault || expanded;

  return (
    <div>
      {/* TODO: Should these be in the details? Or in the header? */}
      {item.percentComplete !== 0 && !item.complete && (
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
        {itemDetails ? (
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
            {tab === ItemPopupTab.Reviews && <ItemReviews item={item} />}
          </>
        ) : (
          <div className="item-popup-collapsed item-details">
            <button className="dim-button" onClick={onToggleExpanded}>
              <AppIcon icon={faChevronCircleDown} /> {t('MovePopup.Expand')}
            </button>
          </div>
        )}
        <ItemActions item={item} />
      </div>
    </div>
  );
}
