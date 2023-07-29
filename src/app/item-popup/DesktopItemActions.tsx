import { addCompareItem } from 'app/compare/actions';
import { useHotkey } from 'app/hotkeys/useHotkey';
import { t } from 'app/i18next-t';
import { showInfuse } from 'app/infuse/infuse';
import { DimItem } from 'app/inventory/item-types';
import { moveItemTo } from 'app/inventory/move-item';
import { sortedStoresSelector } from 'app/inventory/selectors';
import { getCurrentStore, getVault } from 'app/inventory/stores-helpers';
import ItemAccessoryButtons from 'app/item-actions/ItemAccessoryButtons';
import ItemMoveLocations from 'app/item-actions/ItemMoveLocations';
import { hideItemPopup } from 'app/item-popup/item-popup';
import { useSetting } from 'app/settings/hooks';
import { AppIcon, maximizeIcon, minimizeIcon } from 'app/shell/icons';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import clsx from 'clsx';
import { useSelector } from 'react-redux';
import styles from './DesktopItemActions.m.scss';
import { ItemActionsModel } from './item-popup-actions';

export const menuClassName = styles.interaction;

export default function DesktopItemActions({
  item,
  actionsModel,
}: {
  item: DimItem;
  actionsModel: ItemActionsModel;
}) {
  const stores = useSelector(sortedStoresSelector);
  const dispatch = useThunkDispatch();
  const [sidecarCollapsed, setSidecarCollapsed] = useSetting('sidecarCollapsed');

  const toggleSidecar = () => setSidecarCollapsed(!sidecarCollapsed);

  useHotkey('esc', t('Hotkey.ClearDialog'), () => hideItemPopup());

  useHotkey('k', t('MovePopup.ToggleSidecar'), toggleSidecar);
  useHotkey('p', t('Hotkey.Pull'), () => {
    // TODO: if movable
    const currentChar = getCurrentStore(stores)!;
    dispatch(moveItemTo(item, currentChar, false, item.amount));
    hideItemPopup();
  });
  useHotkey('v', t('Hotkey.Vault'), () => {
    // TODO: if vaultable
    const vault = getVault(stores)!;
    dispatch(moveItemTo(item, vault, false, item.amount));
    hideItemPopup();
  });
  useHotkey('c', t('Compare.ButtonHelp'), () => {
    if (item.comparable) {
      hideItemPopup();
      dispatch(addCompareItem(item));
    }
  });
  useHotkey('i', t('MovePopup.InfuseTitle'), (e: KeyboardEvent) => {
    if (item.infusable) {
      e.preventDefault();
      showInfuse(item);
      hideItemPopup();
    }
  });

  return (
    <div className={clsx(styles.interaction, { [styles.collapsed]: sidecarCollapsed })}>
      {actionsModel.hasControls && (
        <button
          type="button"
          className={styles.collapseButton}
          onClick={toggleSidecar}
          title={`${t('MovePopup.ToggleSidecar')} [K]`}
          aria-keyshortcuts="k"
        >
          <AppIcon icon={sidecarCollapsed ? maximizeIcon : minimizeIcon} />
        </button>
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
