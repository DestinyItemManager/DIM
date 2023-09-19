import RichDestinyText from 'app/dim-ui/destiny-symbols/RichDestinyText';
import { t } from 'app/i18next-t';
import { doShowTriage, ItemTriage, TriageTabToggle } from 'app/item-triage/ItemTriage';
import clsx from 'clsx';
import { DimItem } from '../inventory/item-types';
import { ItemPopupExtraInfo } from './item-popup';
import ItemDetails from './ItemDetails';
import styles from './ItemPopupBody.m.scss';
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
  onTabChanged: (tab: ItemPopupTab) => void;
}) {
  const failureStrings = Array.from(extraInfo?.failureStrings || []);
  if (item.owner !== 'unknown' && !item.canPullFromPostmaster && item.location.inPostmaster) {
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
      title: <TriageTabToggle item={item} currentTab={tab} />,
      component: <ItemTriage item={item} />,
    });
  }

  return (
    <div>
      {/* TODO: Should these be in the details? Or in the header? */}
      {failureStrings.map(
        (failureString) =>
          failureString.length > 0 && (
            <div className={styles.failureReason} key={failureString}>
              <RichDestinyText text={failureString} ownerId={item.owner} />
            </div>
          )
      )}
      {tabs.length > 1 ? (
        <>
          <div className={styles.movePopupTabs}>
            {tabs.map((ta) => (
              <span
                key={ta.tab}
                className={clsx(styles.movePopupTab, {
                  [styles.selected]: tab === ta.tab,
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
  );
}
