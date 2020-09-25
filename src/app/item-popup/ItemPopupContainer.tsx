import { settingsSelector } from 'app/dim-api/selectors';
import { usePopper } from 'app/dim-ui/usePopper';
import { useHotkey } from 'app/hotkeys/useHotkey';
import { t } from 'app/i18next-t';
import { storesSelector } from 'app/inventory/selectors';
import { DimStore } from 'app/inventory/store-types';
import { RootState } from 'app/store/types';
import { useSubscription } from 'app/utils/hooks';
import clsx from 'clsx';
import React, { useEffect, useRef, useState } from 'react';
import { connect } from 'react-redux';
import { useLocation } from 'react-router';
import ClickOutside from '../dim-ui/ClickOutside';
import Sheet from '../dim-ui/Sheet';
import { DimItem } from '../inventory/item-types';
import { setSetting } from '../settings/actions';
import DesktopItemActions from './DesktopItemActions';
import { ItemPopupExtraInfo, showItemPopup$ } from './item-popup';
import ItemActions from './ItemActions';
import ItemPopupBody, { ItemPopupTab } from './ItemPopupBody';
import styles from './ItemPopupContainer.m.scss';
import ItemPopupHeader from './ItemPopupHeader';
import ItemTagHotkeys from './ItemTagHotkeys';

interface ProvidedProps {
  boundarySelector?: string;
}

interface StoreProps {
  isPhonePortrait: boolean;
  itemDetails: boolean;
  stores: DimStore[];
  language: string;
}

function mapStateToProps(state: RootState): StoreProps {
  const settings = settingsSelector(state);
  return {
    stores: storesSelector(state),
    isPhonePortrait: state.shell.isPhonePortrait,
    itemDetails: settings.itemDetails,
    language: settings.language,
  };
}

const mapDispatchToProps = {
  setSetting,
};
type DispatchProps = typeof mapDispatchToProps;

type Props = ProvidedProps & StoreProps & DispatchProps;

const tierClasses: { [key in DimItem['tier']]: string } = {
  Exotic: styles.exotic,
  Legendary: styles.legendary,
  Rare: styles.rare,
  Uncommon: styles.uncommon,
  Common: styles.common,
  Unknown: '',
  Currency: '',
} as const;

/**
 * A container that can show a single item popup/tooltip. This is a
 * single element to help prevent multiple popups from showing at once.
 */
function ItemPopupContainer({
  isPhonePortrait,
  itemDetails,
  stores,
  language,
  boundarySelector,
  setSetting,
}: Props) {
  const [tab, setTab] = useState(ItemPopupTab.Overview);
  const [currentItem, setCurrentItem] = useState<{
    item: DimItem;
    element?: HTMLElement;
    extraInfo?: ItemPopupExtraInfo;
  }>();
  const onTabChanged = (newTab: ItemPopupTab) => {
    if (newTab !== tab) {
      setTab(newTab);
    }
  };

  const onClose = () => setCurrentItem(undefined);

  const toggleItemDetails = () => {
    setSetting('itemDetails', !itemDetails);
  };

  useSubscription(() =>
    showItemPopup$.subscribe(({ item, element, extraInfo }) => {
      if (!item || item === currentItem?.item) {
        onClose();
      } else {
        setCurrentItem({
          item,
          element,
          extraInfo,
        });
        // Log the item so it's easy to inspect item structure by clicking on an item
        if ($DIM_FLAVOR !== 'release') {
          console.log(item);
        }
      }
    })
  );

  const { pathname } = useLocation();
  useEffect(() => {
    onClose();
  }, [pathname]);

  const popupRef = useRef<HTMLDivElement>(null);
  usePopper({
    placement: 'right',
    contents: popupRef,
    reference: { current: currentItem?.element || null },
    boundarySelector,
    arrowClassName: styles.arrow,
  });

  useHotkey('esc', t('Hotkey.ClearDialog'), onClose);

  if (!currentItem?.item) {
    return null;
  }

  // Try to find an updated version of the item!
  const item = maybeFindItem(currentItem.item, stores);

  const header = (
    <ItemPopupHeader
      item={item}
      key={`header${item.index}`}
      language={language}
      expanded={isPhonePortrait || itemDetails || $featureFlags.newItemPopupActions}
      showToggle={!isPhonePortrait}
      onToggleExpanded={toggleItemDetails}
    />
  );

  const body = (
    <ItemPopupBody
      item={item}
      key={`body${item.index}`}
      extraInfo={currentItem.extraInfo}
      tab={tab}
      expanded={isPhonePortrait || itemDetails || $featureFlags.newItemPopupActions}
      onTabChanged={onTabChanged}
      onToggleExpanded={toggleItemDetails}
    />
  );

  return isPhonePortrait ? (
    <Sheet
      onClose={onClose}
      header={header}
      sheetClassName={clsx('item-popup', `is-${item.tier}`)}
      footer={<ItemActions key={item.index} item={item} />}
    >
      <div className={styles.popupBackground}>{body}</div>
    </Sheet>
  ) : (
    <div
      className={clsx('item-popup', styles.movePopupDialog, tierClasses[item.tier])}
      ref={popupRef}
      role="dialog"
      aria-modal="false"
    >
      <ClickOutside onClickOutside={onClose}>
        <ItemTagHotkeys item={item} />
        {$featureFlags.newItemPopupActions ? (
          <div className={styles.desktopPopup}>
            <div className={clsx(styles.desktopPopupBody, styles.popupBackground)}>
              {header}
              {body}
            </div>
            <div className={clsx(styles.desktopActions)}>
              <DesktopItemActions key={item.index} item={item} />
            </div>
          </div>
        ) : (
          <div className={clsx(styles.desktopPopupBody, styles.popupBackground)}>
            {header}
            {body}
            <div className="item-details">
              <ItemActions key={item.index} item={item} />
            </div>
          </div>
        )}
      </ClickOutside>
      <div className={clsx('arrow', styles.arrow, tierClasses[item.tier])} />
    </div>
  );
}

export default connect<StoreProps, DispatchProps>(
  mapStateToProps,
  mapDispatchToProps
)(ItemPopupContainer);

/**
 * The passed in item may be old - look through stores to try and find a newer version!
 * This helps with items that have objectives, like Pursuits.
 *
 * TODO: This doesn't work for the synthetic items created for Milestones.
 */
function maybeFindItem(item: DimItem, stores: DimStore[]) {
  // Don't worry about non-instanced items
  if (item.id === '0') {
    return item;
  }

  for (const store of stores) {
    for (const storeItem of store.items) {
      if (storeItem.id === item.id) {
        return storeItem;
      }
    }
  }
  // Didn't find it, use what we've got.
  return item;
}
