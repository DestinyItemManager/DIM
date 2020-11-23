import { t } from 'app/i18next-t';
import { ItemTriage } from 'app/item-triage/ItemTriage';
import clsx from 'clsx';
import React from 'react';
import { DimItem } from '../inventory/item-types';
import { percent } from '../shell/filters';
import { ItemPopupExtraInfo } from './item-popup';
import ItemDetails from './ItemDetails';
import './ItemPopupBody.scss';

export const enum ItemPopupTab {
  Overview,
  Triage,
}

/** The main portion of the item popup, with pages of info (Actions, Details, Reviews) */
export default function ItemPopupBody({
  item,
  failureStrings,
  extraInfo,
  tab,
  onTabChanged,
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

  const tabs = [
    {
      tab: ItemPopupTab.Overview,
      title: t('MovePopup.OverviewTab'),
      component: <ItemDetails item={item} extraInfo={extraInfo} />,
    },
  ];
  if (
    $featureFlags.triage &&
    item.destinyVersion === 2 &&
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
        {tabs.length > 1 ? (
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
            <div>{tabs.find((t) => t.tab === tab)?.component}</div>
          </>
        ) : (
          tabs[0].component
        )}
      </div>
    </div>
  );
}
