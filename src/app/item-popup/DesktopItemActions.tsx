import { addCompareItem } from 'app/compare/actions';
import { useHotkey } from 'app/hotkeys/useHotkey';
import { t } from 'app/i18next-t';
import { DimItem } from 'app/inventory/item-types';
import { moveItemTo } from 'app/inventory/move-item';
import { sortedStoresSelector } from 'app/inventory/selectors';
import { getCurrentStore, getVault } from 'app/inventory/stores-helpers';
import ItemAccessoryButtons from 'app/item-popup/item-actions/ItemAccessoryButtons';
import ItemMoveLocations from 'app/item-popup/item-actions/ItemMoveLocations';
import { hideItemPopup } from 'app/item-popup/item-popup';
import { useSetting } from 'app/settings/hooks';
import { AppIcon, maximizeIcon, minimizeIcon } from 'app/shell/icons';
import clsx from 'clsx';
import _ from 'lodash';
import React, { useLayoutEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styles from './DesktopItemActions.m.scss';
import { ItemActionsModel } from './item-popup-actions';

const sharedButtonProps = { role: 'button', tabIndex: -1 };

export default function DesktopItemActions({
  item,
  actionsModel,
}: {
  item: DimItem;
  actionsModel: ItemActionsModel;
}) {
  const stores = useSelector(sortedStoresSelector);
  const dispatch = useDispatch();
  const [sidecarCollapsed, setSidecarCollapsed] = useSetting('sidecarCollapsed');

  const toggleSidecar = () => setSidecarCollapsed(!sidecarCollapsed);

  useHotkey('k', t('MovePopup.ToggleSidecar'), toggleSidecar);
  useHotkey('p', t('Hotkey.Pull'), () => {
    // TODO: if movable
    const currentChar = getCurrentStore(stores)!;
    dispatch(moveItemTo(item, currentChar, false, item.maxStackSize));
    hideItemPopup();
  });
  useHotkey('v', t('Hotkey.Vault'), () => {
    // TODO: if vaultable
    const vault = getVault(stores)!;
    dispatch(moveItemTo(item, vault, false, item.maxStackSize));
    hideItemPopup();
  });
  useHotkey('c', t('Compare.ButtonHelp'), () => {
    if (item.comparable) {
      hideItemPopup();
      dispatch(addCompareItem(item));
    }
  });

  const containerRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const reposition = () => {
      if (containerRef.current) {
        const parent = containerRef.current.closest('.item-popup');
        const arrow = parent?.querySelector('.arrow');
        if (!arrow || !parent) {
          return;
        }
        const arrowRect = arrow.getBoundingClientRect();
        const parentRect = parent.getBoundingClientRect();
        const containerHeight = containerRef.current.clientHeight;
        const offset = arrowRect.top - parentRect.top + 2.5;

        const top = _.clamp(offset - containerHeight / 2, 0, parent.clientHeight - containerHeight);

        // Originally this used translateY, but that caused menus to not work on Safari.
        containerRef.current.style.marginTop = `${Math.round(top)}px`;

        // TODO: also don't push it off screen
      }
    };

    reposition();
    setTimeout(reposition, 10);
  });

  return (
    <div
      className={clsx(styles.interaction, { [styles.collapsed]: sidecarCollapsed })}
      ref={containerRef}
    >
      {actionsModel.hasControls && (
        <div
          className={styles.collapseButton}
          onClick={toggleSidecar}
          title={t('MovePopup.ToggleSidecar') + ' [K]'}
          {...sharedButtonProps}
        >
          <AppIcon icon={sidecarCollapsed ? maximizeIcon : minimizeIcon} />
        </div>
      )}

      <ItemAccessoryButtons
        item={item}
        mobile={false}
        showLabel={!sidecarCollapsed}
        actionsModel={actionsModel}
      />

      {!sidecarCollapsed && (
        <ItemMoveLocations
          key={item.index}
          item={item}
          splitVault={true}
          actionsModel={actionsModel}
        />
      )}
    </div>
  );
}
