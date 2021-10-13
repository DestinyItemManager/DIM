import { t } from 'app/i18next-t';
import { insertPlug } from 'app/inventory/advanced-write-actions';
import { DimItem, DimSocket } from 'app/inventory/item-types';
import { SocketOverrides } from 'app/inventory/store/override-sockets';
import { AppIcon, faCheckCircle, refreshIcon, thumbsUpIcon } from 'app/shell/icons';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import { wishListSelector } from 'app/wishlists/selectors';
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import styles from './ApplyPerkSelection.m.scss';

export default function ApplyPerkSelection({
  item,
  socketOverrides,
  setSocketOverride,
  onApplied,
}: {
  item: DimItem;
  socketOverrides: SocketOverrides;
  setSocketOverride: (value: { item: DimItem; socket: DimSocket; plugHash: number }) => void;
  onApplied: () => void;
}) {
  const dispatch = useThunkDispatch();
  const [insertInProgress, setInsertInProgress] = useState(false);
  const wishlistRoll = useSelector(wishListSelector(item));
  if (!item.sockets) {
    return null;
  }

  const onInsertPlugs = async () => {
    if (insertInProgress) {
      return;
    }
    setInsertInProgress(true);
    try {
      for (const [socketIndexStr, plugHash] of Object.entries(socketOverrides)) {
        const socketIndex = parseInt(socketIndexStr, 10);
        const socket = item.sockets?.allSockets.find((s) => s.socketIndex === socketIndex);
        if (socket) {
          await dispatch(insertPlug(item, socket, plugHash));
        }
      }
      onApplied();
    } finally {
      setInsertInProgress(false);
    }
  };

  let hasOverrides = false;
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
        wishlistRoll.wishListPerks.has(p.plugDef.hash)
      );
      if (
        wishlistPlug &&
        socket.actuallyPlugged !== wishlistPlug &&
        socket.plugged !== wishlistPlug
      ) {
        wishListSocketChanges.push({ socket, plugHash: wishlistPlug.plugDef.hash });
      }
    }

    if (socket.actuallyPlugged) {
      hasOverrides = true;
    }
  }

  const selectWishlistPerks = () => {
    for (const change of wishListSocketChanges) {
      setSocketOverride({ ...change, item });
    }
  };

  if (!(wishListSocketChanges.length > 0 || hasOverrides)) {
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
      {$featureFlags.awa && hasOverrides && (
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
