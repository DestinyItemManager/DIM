import RichDestinyText from 'app/dim-ui/RichDestinyText';
import { t } from 'app/i18next-t';
import { doShowTriage, ItemTriage } from 'app/item-triage/ItemTriage';
import { percent } from 'app/shell/formatters';
import { AppIcon, thumbsUpIcon } from 'app/shell/icons';
import { wishListSelector } from 'app/wishlists/selectors';
import clsx from 'clsx';
import React from 'react';
import { useSelector } from 'react-redux';
import { DimItem } from '../inventory/item-types';
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
  const wishlistRoll = useSelector(wishListSelector(item));
  const failureStrings = Array.from(extraInfo?.failureStrings || []);
  if (!item.canPullFromPostmaster && item.location.inPostmaster) {
    failureStrings.push(t('MovePopup.CantPullFromPostmaster'));
  }

  const tabs: {
    tab: ItemPopupTab;
    title: JSX.Element | string;
    component: JSX.Element;
  }[] = [
    {
      tab: ItemPopupTab.Overview,
      title: t('MovePopup.OverviewTab'),
      component: <ItemDetails item={item} extraInfo={extraInfo} />,
    },
  ];
  if ($featureFlags.triage && doShowTriage(item)) {
    tabs.push({
      tab: ItemPopupTab.Triage,
      title: (
        <span className="popup-tab-title">
          {t('MovePopup.TriageTab')}
          {tab === ItemPopupTab.Overview && wishlistRoll && (
            <AppIcon
              className="thumbs-up"
              icon={thumbsUpIcon}
              title={t('WishListRoll.BestRatedTip')}
            />
          )}
        </span>
      ),
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
              <RichDestinyText text={failureString} ownerId={item.owner} />
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
