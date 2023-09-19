import { t } from 'app/i18next-t';
import { DimItem } from 'app/inventory/item-types';
import { ItemTriage, TriageTabToggle, doShowTriage } from 'app/item-triage/ItemTriage';
import clsx from 'clsx';
import { useState } from 'react';
import ItemDetails from './ItemDetails';
import styles from './ItemPopupTabs.m.scss';
import { ItemPopupExtraInfo } from './item-popup';

const enum ItemPopupTab {
  Overview,
  Triage,
}

export function useItemPopupTabs(item: DimItem, extraInfo: ItemPopupExtraInfo | undefined) {
  const [tab, setTab] = useState(ItemPopupTab.Overview);
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
      title: <TriageTabToggle item={item} tabActive={tab === ItemPopupTab.Triage} />,
      component: <ItemTriage item={item} />,
    });
  }

  const content = (tabs.length > 1 ? tabs.find((t) => t.tab === tab)! : tabs[0]).component;

  const tabButtons =
    tabs.length > 1 ? (
      <div className={styles.movePopupTabs}>
        {tabs.map((ta) => (
          <span
            key={ta.tab}
            className={clsx(styles.movePopupTab, {
              [styles.selected]: tab === ta.tab,
            })}
            onClick={() => setTab(ta.tab)}
          >
            {ta.title}
          </span>
        ))}
      </div>
    ) : undefined;

  return {
    content,
    tabButtons,
  } as const;
}
