import React from 'react';
import { DimItem } from '../inventory/item-types';
import { t } from 'app/i18next-t';
import ItemDetails from './ItemDetails';
import { ItemPopupExtraInfo } from './item-popup';
import clsx from 'clsx';
import ItemReviews from '../item-review/ItemReviews';
import { percent } from '../shell/filters';
import { AppIcon, openDropdownIcon } from '../shell/icons';
import { Frame, Track, View, ViewPager } from 'react-view-pager';
import './ItemPopupBody.scss';
import { ItemTriage } from 'app/item-triage/ItemTriage';

export const enum ItemPopupTab {
  Overview,
  Triage,
  Reviews,
}

const spring = { stiffness: 200, damping: 22 };

/** The main portion of the item popup, with pages of info (Actions, Details, Reviews) */
export default function ItemPopupBody({
  item,
  failureStrings,
  extraInfo,
  tab,
  expanded,
  onTabChanged,
  onToggleExpanded,
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

  const tabs = [
    {
      tab: ItemPopupTab.Overview,
      title: t('MovePopup.OverviewTab'),
      component: <ItemDetails item={item} extraInfo={extraInfo} />,
    },
  ];
  if (
    $featureFlags.triage &&
    item.isDestiny2() &&
    (item.bucket.inArmor ||
      (item.bucket.sort === 'Weapons' &&
        item.bucket.type !== 'SeasonalArtifacts' &&
        item.bucket.type !== 'Class'))
    //   ||
    // (item.bucket.sort === 'General' &&
    //   (item.bucket.type === 'Ghost' ||        // enable these once there's
    //     item.bucket.type === 'Vehicle' ||     // factor rules for them
    //     item.bucket.type === 'Ships'))
  ) {
    tabs.push({
      tab: ItemPopupTab.Triage,
      title: t('MovePopup.TriageTab'),
      component: <ItemTriage item={item} />,
    });
  }
  if ($featureFlags.reviewsEnabled && item.reviewable) {
    tabs.push({
      tab: ItemPopupTab.Reviews,
      title: t('MovePopup.ReviewsTab'),
      component: <ItemReviews item={item} />,
    });
  }

  const onViewChange = (indices) => {
    onTabChanged(tabs[indices[0]].tab);
  };

  const onRest = () => onTabChanged(tab);

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
          tabs.length > 1 ? (
            <>
              <div className="move-popup-tabs">
                {tabs.map((ta) => (
                  <span
                    key={ta.tab}
                    className={clsx('move-popup-tab', {
                      selected: tab === ta.tab,
                    })}
                    onClick={() => onTabChanged(ta.tab)}
                  >
                    {ta.title}
                  </span>
                ))}
              </div>
              <ViewPager>
                <Frame className="frame" autoSize="height">
                  <Track
                    currentView={tab}
                    contain={false}
                    className="track"
                    onViewChange={onViewChange}
                    onRest={onRest}
                    springConfig={spring}
                  >
                    {tabs.map((ta) => (
                      <View key={ta.tab}>{ta.component}</View>
                    ))}
                  </Track>
                </Frame>
              </ViewPager>
            </>
          ) : (
            tabs[0].component
          )
        ) : (
          <div className="item-popup-collapsed item-details">
            <button type="button" className="dim-button" onClick={onToggleExpanded}>
              <AppIcon icon={openDropdownIcon} /> {t('MovePopup.Expand')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
