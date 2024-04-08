import ClickOutside from 'app/dim-ui/ClickOutside';
import { PressTipRoot } from 'app/dim-ui/PressTip';
import Sheet from 'app/dim-ui/Sheet';
import RichDestinyText from 'app/dim-ui/destiny-symbols/RichDestinyText';
import { usePopper } from 'app/dim-ui/usePopper';
import { t } from 'app/i18next-t';
import { DimItem } from 'app/inventory/item-types';
import { sortedStoresSelector } from 'app/inventory/selectors';
import ItemAccessoryButtons from 'app/item-actions/ItemAccessoryButtons';
import ItemMoveLocations from 'app/item-actions/ItemMoveLocations';
import type { ItemTierName } from 'app/search/d2-known-values';
import { useIsPhonePortrait } from 'app/shell/selectors';
import { Portal } from 'app/utils/temp-container';
import clsx from 'clsx';
import { useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';
import DesktopItemActions, { menuClassName } from './DesktopItemActions';
import styles from './ItemPopup.m.scss';
import ItemPopupHeader from './ItemPopupHeader';
import { useItemPopupTabs } from './ItemPopupTabs';
import ItemTagHotkeys from './ItemTagHotkeys';
import { ItemPopupExtraInfo } from './item-popup';
import { buildItemActionsModel } from './item-popup-actions';

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
  onClose: () => void;
}) {
  const { content, tabButtons } = useItemPopupTabs(item, extraInfo);
  const stores = useSelector(sortedStoresSelector);
  const isPhonePortrait = useIsPhonePortrait();

  const popupRef = useRef<HTMLDivElement>(null);
  usePopper({
    placement: 'right',
    contents: popupRef,
    reference: { current: element || null },
    boundarySelector,
    arrowClassName: styles.arrow,
    menuClassName: menuClassName,
  });

  // TODO: we need this to fire after popper repositions the popup. Maybe try again when we switch to floatingui.
  // useFocusFirstFocusableElement(popupRef);

  const itemActionsModel = useMemo(
    () => item && buildItemActionsModel(item, stores),
    [item, stores],
  );

  const failureStrings = Array.from(extraInfo?.failureStrings ?? []);
  if (item.owner !== 'unknown' && !item.canPullFromPostmaster && item.location.inPostmaster) {
    failureStrings.push(t('MovePopup.CantPullFromPostmaster'));
  }

  const header = (
    <div className={styles.header}>
      <ItemPopupHeader item={item} key={`header${item.hash}`} noLink={noLink} />
      {failureStrings?.map(
        (failureString) =>
          failureString.length > 0 && (
            <div className={styles.failureReason} key={failureString}>
              <RichDestinyText text={failureString} ownerId={item.owner} />
            </div>
          ),
      )}
      {isPhonePortrait && itemActionsModel.hasAccessoryControls && (
        <div className={styles.mobileItemActions}>
          <ItemAccessoryButtons
            item={item}
            mobile={true}
            showLabel={false}
            actionsModel={itemActionsModel}
          />
        </div>
      )}
      {tabButtons}
    </div>
  );

  return isPhonePortrait ? (
    <Sheet
      onClose={onClose}
      zIndex={zIndex}
      header={header}
      headerClassName={styles.sheetHeader}
      closeButtonClassName={styles.sheetClose}
      sheetClassName={clsx(tierClasses[item.tier], styles.movePopupDialog)}
      footer={
        itemActionsModel.hasMoveControls && (
          <div className={styles.mobileMoveLocations}>
            <ItemMoveLocations key={item.index} item={item} actionsModel={itemActionsModel} />
          </div>
        )
      }
    >
      <div className={styles.popupBackground}>{content}</div>
    </Sheet>
  ) : (
    <Portal>
      <div
        className={clsx(
          'item-popup',
          styles.movePopupDialog,
          tierClasses[item.tier],
          styles.desktopPopupRoot,
        )}
        style={{ zIndex }}
        ref={popupRef}
        role="dialog"
        aria-modal="false"
      >
        <ClickOutside onClickOutside={onClose}>
          <PressTipRoot.Provider value={popupRef}>
            <ItemTagHotkeys item={item} />
            <div className={styles.desktopPopup}>
              <div className={clsx(styles.desktopPopupBody, styles.popupBackground)}>
                {header}
                {content}
              </div>
              {itemActionsModel.hasControls && (
                <div className={styles.desktopActions}>
                  <DesktopItemActions item={item} actionsModel={itemActionsModel} />
                </div>
              )}
            </div>
          </PressTipRoot.Provider>
        </ClickOutside>
        <div className={clsx('arrow', styles.arrow, tierClasses[item.tier])} />
      </div>
    </Portal>
  );
}
