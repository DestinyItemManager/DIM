import { t } from 'app/i18next-t';
import { canInsertPlug, insertPlug } from 'app/inventory/advanced-write-actions';
import { DimItem, DimSocket } from 'app/inventory/item-types';
import { destiny2CoreSettingsSelector, useD2Definitions } from 'app/manifest/selectors';
import { showNotification } from 'app/notifications/notifications';
import { AppIcon, faCheckCircle, refreshIcon, thumbsUpIcon } from 'app/shell/icons';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import { errorMessage } from 'app/utils/errors';
import { wishListSelector } from 'app/wishlists/selectors';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import * as styles from './ApplyPerkSelection.m.scss';

export default function ApplyPerkSelection({
  item,
  setSocketOverride,
  onApplied,
}: {
  item: DimItem;
  setSocketOverride: (value: { item: DimItem; socket: DimSocket; plugHash: number }) => void;
  onApplied: () => void;
}) {
  const dispatch = useThunkDispatch();
  const defs = useD2Definitions()!;
  const destiny2CoreSettings = useSelector(destiny2CoreSettingsSelector)!;
  const [insertInProgress, setInsertInProgress] = useState(false);
  const wishlistRoll = useSelector(wishListSelector(item));
  if (!item.sockets) {
    return null;
  }

  const plugOverridesToSave: { socket: DimSocket; plugHash: number }[] = [];
  const wishListSocketChanges: { socket: DimSocket; plugHash: number }[] = [];
  for (const socket of item.sockets.allSockets) {
    // Find wishlist perks that aren't selected
    if (
      wishlistRoll &&
      !wishlistRoll.isUndesirable &&
      socket.isPerk &&
      socket.plugOptions.length > 1
    ) {
      const wishlistPlug = socket.plugOptions.find((p) =>
        wishlistRoll.wishListPerks.has(p.plugDef.hash),
      );
      if (
        wishlistPlug &&
        socket.actuallyPlugged !== wishlistPlug &&
        socket.plugged !== wishlistPlug
      ) {
        wishListSocketChanges.push({ socket, plugHash: wishlistPlug.plugDef.hash });
      }
    }

    if (
      !item.vendor &&
      socket.actuallyPlugged &&
      socket.plugged &&
      canInsertPlug(socket, socket.plugged.plugDef.hash, destiny2CoreSettings, defs)
    ) {
      plugOverridesToSave.push({ socket, plugHash: socket.plugged.plugDef.hash });
    }
  }

  const onInsertPlugs = async () => {
    if (insertInProgress) {
      return;
    }
    setInsertInProgress(true);
    try {
      for (const { socket, plugHash } of plugOverridesToSave) {
        try {
          await dispatch(insertPlug(item, socket, plugHash));
        } catch (e) {
          const plugName =
            defs.InventoryItem.get(plugHash)?.displayProperties.name ?? 'Unknown Plug';
          showNotification({
            type: 'error',
            title: t('AWA.Error'),
            body: t('AWA.ErrorMessage', {
              error: errorMessage(e),
              item: item.name,
              plug: plugName,
            }),
          });
          return; // bail out without calling onApplied
        }
      }
      onApplied();
    } finally {
      setInsertInProgress(false);
    }
  };

  const selectWishlistPerks = () => {
    for (const change of wishListSocketChanges) {
      setSocketOverride({ ...change, item });
    }
  };

  if (wishListSocketChanges.length === 0 && plugOverridesToSave.length === 0) {
    return null;
  }

  // TODO: "ProgressButton"
  return (
    <div className={styles.buttons}>
      {wishListSocketChanges.length > 0 && (
        <button type="button" className="dim-button" onClick={selectWishlistPerks}>
          <AppIcon icon={thumbsUpIcon} /> {t('Sockets.SelectWishlistPerks')}
        </button>
      )}
      {plugOverridesToSave.length > 0 && (
        <button
          type="button"
          className={styles.insertButton}
          onClick={onInsertPlugs}
          disabled={insertInProgress}
        >
          {insertInProgress && (
            <span>
              <AppIcon icon={refreshIcon} spinning={true} />
            </span>
          )}
          <span>
            <AppIcon icon={faCheckCircle} /> {t('Sockets.ApplyPerks')}
          </span>
        </button>
      )}
    </div>
  );
}
