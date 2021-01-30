import { t } from 'app/i18next-t';
import { sortedStoresSelector } from 'app/inventory/selectors';
import { getStore } from 'app/inventory/stores-helpers';
import { ItemTriage } from 'app/item-triage/ItemTriage';
import { canBePulledFromPostmaster } from 'app/loadout/postmaster';
import clsx from 'clsx';
import { BucketHashes } from 'data/d2/generated-enums';
import React from 'react';
import { useSelector } from 'react-redux';
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
  extraInfo,
  tab,
  onTabChanged,
}: {
  item: DimItem;
  extraInfo?: ItemPopupExtraInfo;
  tab: ItemPopupTab;
  onTabChanged(tab: ItemPopupTab): void;
}) {
  const failureStrings = Array.from(extraInfo?.failureStrings || []);
  const isEngramCollected = item.location.hash === BucketHashes.Engrams;
  const stores = useSelector(sortedStoresSelector);
  const store = getStore(stores, item.owner);

  if (!store) {
    return null;
  }

  const isTransferable = canBePulledFromPostmaster(item, store, stores);

  if (!isTransferable || isEngramCollected) {
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
