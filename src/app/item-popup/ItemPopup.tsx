import ClickOutside from 'app/dim-ui/ClickOutside';
import Sheet from 'app/dim-ui/Sheet';
import { usePopper } from 'app/dim-ui/usePopper';
import { DimItem } from 'app/inventory/item-types';
import { sortedStoresSelector } from 'app/inventory/selectors';
import ItemAccessoryButtons from 'app/item-actions/ItemAccessoryButtons';
import ItemMoveLocations from 'app/item-actions/ItemMoveLocations';
import type { ItemTierName } from 'app/search/d2-known-values';
import { useIsPhonePortrait } from 'app/shell/selectors';
import clsx from 'clsx';
import React, { useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import DesktopItemActions from './DesktopItemActions';
import { ItemPopupExtraInfo } from './item-popup';
import { buildItemActionsModel } from './item-popup-actions';
import styles from './ItemPopup.m.scss';
import ItemPopupBody, { ItemPopupTab } from './ItemPopupBody';
import ItemPopupHeader from './ItemPopupHeader';
import ItemTagHotkeys from './ItemTagHotkeys';

const tierClasses: Record<ItemTierName, string> = {
  Exotic: styles.exotic,
  Legendary: styles.legendary,
  Rare: styles.rare,
  Uncommon: styles.uncommon,
  Common: styles.common,
  Unknown: '',
  Currency: '',
} as const;

/**
 * The item inspection popup, which is either a popup on desktop or a sheet on mobile.
 */
export default function ItemPopup({
  item,
  element,
  extraInfo,
  boundarySelector,
  zIndex,
  noLink,
  onClose,
}: {
  item: DimItem;
  element?: HTMLElement;
  extraInfo?: ItemPopupExtraInfo;
  boundarySelector?: string;
  zIndex?: number;
  /** Don't allow opening Armory from the header link */
  noLink?: boolean;
  onClose(): void;
}) {
  const [tab, setTab] = useState(ItemPopupTab.Overview);
  const stores = useSelector(sortedStoresSelector);
  const isPhonePortrait = useIsPhonePortrait();

  const popupRef = useRef<HTMLDivElement>(null);
  usePopper({
    placement: 'right',
    contents: popupRef,
    reference: { current: element || null },
    boundarySelector,
    arrowClassName: styles.arrow,
  });

  const itemActionsModel = useMemo(
    () => item && buildItemActionsModel(item, stores),
    [item, stores]
  );

  const body = (
    <ItemPopupBody
      item={item}
      key={`body${item.index}`}
      extraInfo={extraInfo}
      tab={tab}
      onTabChanged={setTab}
    />
  );

  const header = <ItemPopupHeader item={item} key={`header${item.index}`} noLink={noLink} />;

  return isPhonePortrait ? (
    <Sheet
      onClose={onClose}
      zIndex={zIndex}
      header={header}
      sheetClassName={clsx(
        'item-popup',
        `is-${item.tier}`,
        tierClasses[item.tier],
        styles.movePopupDialog
      )}
      footer={
        itemActionsModel.hasMoveControls && (
          <div className={styles.mobileMoveLocations}>
            <ItemMoveLocations key={item.index} item={item} actionsModel={itemActionsModel} />
          </div>
        )
      }
    >
      {itemActionsModel.hasAccessoryControls && (
        <div className={styles.mobileItemActions}>
          <ItemAccessoryButtons
            item={item}
            mobile={true}
            showLabel={false}
            actionsModel={itemActionsModel}
          />
        </div>
      )}
      <div className={styles.popupBackground}>{body}</div>
    </Sheet>
  ) : (
    <div
      className={clsx(
        'item-popup',
        styles.movePopupDialog,
        tierClasses[item.tier],
        styles.desktopPopupRoot
      )}
      style={{ zIndex }}
      ref={popupRef}
      role="dialog"
      aria-modal="false"
    >
      <ClickOutside onClickOutside={onClose}>
        <ItemTagHotkeys item={item} />
        <div className={styles.desktopPopup}>
          <div className={clsx(styles.desktopPopupBody, styles.popupBackground)}>
            {header}
            {body}
          </div>
          {itemActionsModel.hasControls && (
            <div className={clsx(styles.desktopActions)}>
              <DesktopItemActions item={item} actionsModel={itemActionsModel} />
            </div>
          )}
        </div>
      </ClickOutside>
      <div className={clsx('arrow', styles.arrow, tierClasses[item.tier])} />
    </div>
  );
}
