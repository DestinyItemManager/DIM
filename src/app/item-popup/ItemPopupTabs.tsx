import { useHotkey } from 'app/hotkeys/useHotkey';
import { t } from 'app/i18next-t';
import { DimItem } from 'app/inventory/item-types';
import { ItemTriage, TriageTabToggle, doShowTriage } from 'app/item-triage/ItemTriage';
import { useSetting } from 'app/settings/hooks';
import { ItemPopupTab } from 'app/settings/initial-settings';
import clsx from 'clsx';
import { useCallback, useId } from 'react';
import ItemDetails from './ItemDetails';
import styles from './ItemPopupTabs.m.scss';
import { ItemPopupExtraInfo } from './item-popup';

export function useItemPopupTabs(item: DimItem, extraInfo: ItemPopupExtraInfo | undefined) {
  const [tab, setTab] = useSetting('itemPopupTab');
  const id = useId();
  const detailsId = `${id}-details`;
  const triageId = `${id}-triage`;

  const tabs: {
    tab: ItemPopupTab;
    id: string;
    title: JSX.Element | string;
    component: JSX.Element;
  }[] = [
    {
      tab: ItemPopupTab.Overview,
      title: t('MovePopup.OverviewTab'),
      id: detailsId,
      component: <ItemDetails item={item} extraInfo={extraInfo} id={detailsId} />,
    },
  ];
  if ($featureFlags.triage && doShowTriage(item)) {
    tabs.push({
      tab: ItemPopupTab.Triage,
      title: <TriageTabToggle item={item} tabActive={tab === ItemPopupTab.Triage} />,
      id: triageId,
      component: <ItemTriage item={item} id={triageId} />,
    });
  }

  // https://www.w3.org/WAI/ARIA/apg/patterns/tabs/
  // The keyboard handling code would need to be modified if we ever have more than two tabs

  const toggleTab = useCallback(
    () => setTab(tab === ItemPopupTab.Overview ? ItemPopupTab.Triage : ItemPopupTab.Overview),
    [setTab, tab]
  );

  const handleKeyDown = (event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowLeft':
      case 'ArrowRight':
      case 'Home':
      case 'End':
        toggleTab();
        event.stopPropagation();
        event.preventDefault();
        break;

      default:
        break;
    }
  };

  useHotkey('t', t('Hotkey.ItemPopupTab'), toggleTab);

  const content = (tabs.length > 1 ? tabs.find((t) => t.tab === tab)! : tabs[0]).component;

  const tabButtons =
    tabs.length > 1 ? (
      <div className={styles.movePopupTabs} role="tablist" aria-label={t('MovePopup.TabList')}>
        {tabs.map((ta) => (
          <button
            type="button"
            role="tab"
            id={`${id}-tab`}
            aria-keyshortcuts="t"
            key={ta.tab}
            className={clsx(styles.movePopupTab, {
              [styles.selected]: tab === ta.tab,
            })}
            aria-selected={tab === ta.tab}
            aria-controls={ta.id}
            onClick={() => setTab(ta.tab)}
            onKeyDown={handleKeyDown}
          >
            {ta.title}
          </button>
        ))}
      </div>
    ) : undefined;

  return {
    content,
    tabButtons,
  } as const;
}
