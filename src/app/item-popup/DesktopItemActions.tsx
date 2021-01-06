import { CompareService } from 'app/compare/compare.service';
import { settingsSelector } from 'app/dim-api/selectors';
import { useHotkey } from 'app/hotkeys/useHotkey';
import { t } from 'app/i18next-t';
import { DimItem } from 'app/inventory/item-types';
import { moveItemTo } from 'app/inventory/move-item';
import { sortedStoresSelector } from 'app/inventory/selectors';
import { amountOfItem, getCurrentStore, getStore, getVault } from 'app/inventory/stores-helpers';
import {
  CompareActionButton,
  ConsolidateActionButton,
  DistributeActionButton,
  InfuseActionButton,
  LoadoutActionButton,
  LockActionButton,
  TagActionButton,
} from 'app/item-actions/ActionButtons';
import ItemMoveLocations from 'app/item-actions/ItemMoveLocations';
import { hideItemPopup } from 'app/item-popup/item-popup';
import { setSetting } from 'app/settings/actions';
import { AppIcon, maximizeIcon, minimizeIcon } from 'app/shell/icons';
import { RootState } from 'app/store/types';
import clsx from 'clsx';
import _ from 'lodash';
import React, { useLayoutEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styles from './DesktopItemActions.m.scss';

const sidecarCollapsedSelector = (state: RootState) => settingsSelector(state).sidecarCollapsed;

const sharedButtonProps = { role: 'button', tabIndex: -1 };

export default function DesktopItemActions({ item }: { item: DimItem }) {
  const stores = useSelector(sortedStoresSelector);
  const dispatch = useDispatch();
  const sidecarCollapsed = useSelector(sidecarCollapsedSelector);
  const itemOwner = getStore(stores, item.owner);

  const toggleSidecar = () => {
    dispatch(setSetting('sidecarCollapsed', !sidecarCollapsed));
  };

  useHotkey('k', t('MovePopup.ToggleSidecar'), toggleSidecar);
  useHotkey('p', t('Hotkey.Pull'), () => {
    const currentChar = getCurrentStore(stores)!;
    dispatch(moveItemTo(item, currentChar, false, item.maxStackSize));
    hideItemPopup();
  });
  useHotkey('v', t('Hotkey.Vault'), () => {
    const vault = getVault(stores)!;
    dispatch(moveItemTo(item, vault, false, item.maxStackSize));
    hideItemPopup();
  });
  useHotkey('c', t('Compare.ButtonHelp'), () => {
    hideItemPopup();
    CompareService.addItemsToCompare([item], true);
  });

  const containerRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const reposition = () => {
      if (containerRef.current) {
        const parent = containerRef.current.closest('.item-popup');
        const arrow = parent?.querySelector('.arrow') as HTMLDivElement;
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

  if (!itemOwner) {
    return null;
  }

  const canConsolidate =
    !item.notransfer &&
    item.location.hasTransferDestination &&
    item.maxStackSize > 1 &&
    stores.some((s) => s !== itemOwner && amountOfItem(s, item) > 0);
  const canDistribute = item.destinyVersion === 1 && !item.notransfer && item.maxStackSize > 1;

  const showCollapse =
    item.taggable ||
    item.lockable ||
    item.trackable ||
    !item.notransfer ||
    item.comparable ||
    canConsolidate ||
    canDistribute ||
    item.equipment ||
    item.infusionFuel;

  return (
    <div
      className={clsx(styles.interaction, { [styles.collapsed]: sidecarCollapsed })}
      ref={containerRef}
    >
      {showCollapse && (
        <div
          className={styles.collapseButton}
          onClick={toggleSidecar}
          title={t('MovePopup.ToggleSidecar') + ' [K]'}
          {...sharedButtonProps}
        >
          <AppIcon icon={sidecarCollapsed ? maximizeIcon : minimizeIcon} />
        </div>
      )}

      <TagActionButton item={item} label={!sidecarCollapsed} />
      <LockActionButton item={item} label={!sidecarCollapsed} />
      <CompareActionButton item={item} label={!sidecarCollapsed} />
      <ConsolidateActionButton item={item} label={!sidecarCollapsed} />
      <DistributeActionButton item={item} label={!sidecarCollapsed} />
      <LoadoutActionButton item={item} label={!sidecarCollapsed} />
      <InfuseActionButton item={item} label={!sidecarCollapsed} />

      {!sidecarCollapsed && <ItemMoveLocations item={item} splitVault={true} />}
    </div>
  );
}
