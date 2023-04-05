import BungieImage from 'app/dim-ui/BungieImage';
import { ConfirmButton } from 'app/dim-ui/ConfirmButton';
import { t } from 'app/i18next-t';
import { DimStore } from 'app/inventory/store-types';
import { applySocketOverrides } from 'app/inventory/store/override-sockets';
import Socket from 'app/item-popup/Socket';
import { editLoadout } from 'app/loadout-drawer/loadout-events';
import { convertInGameLoadoutToDimLoadout } from 'app/loadout-drawer/loadout-type-converters';
import { InGameLoadout, Loadout } from 'app/loadout-drawer/loadout-types';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import { Observable } from 'app/utils/observable';
import { getSocketsByIndexes } from 'app/utils/socket-utils';
import { ItemCategoryHashes, SocketCategoryHashes } from 'data/d2/generated-enums';
import _ from 'lodash';
import React from 'react';
import { useSelector } from 'react-redux';
import Sheet from '../../dim-ui/Sheet';
import { allItemsSelector, createItemContextSelector } from '../../inventory/selectors';
import styles from './InGameLoadoutDetailsSheet.m.scss';
import { InGameLoadoutIconWithIndex } from './InGameLoadoutIcon';
import { applyInGameLoadout, deleteInGameLoadout, prepInGameLoadout } from './ingame-loadout-apply';
import {
  gameLoadoutCompatibleBuckets,
  isValidGameLoadoutPlug,
  useItemsFromInGameLoadout,
} from './ingame-loadout-utils';

export const showGameLoadoutDetails$ = new Observable<InGameLoadout | undefined>(undefined);

/** Show the gear power sheet */
export function showInGameLoadoutDetails(loadout: InGameLoadout) {
  showGameLoadoutDetails$.next(loadout);
}

export function InGameLoadoutDetails({
  store,
  loadout,
  onShare,
  onEdit,
}: {
  store: DimStore;
  loadout: InGameLoadout;
  onShare: (loadout: Loadout) => void;
  onEdit: (loadout: InGameLoadout) => void;
}) {
  const dispatch = useThunkDispatch();
  const itemCreationContext = useSelector(createItemContextSelector);
  const defs = itemCreationContext.defs;
  const items = useItemsFromInGameLoadout(loadout);
  const itemsByBucketHash = _.keyBy(items, (i) => i.bucket.hash);
  const reset = () => {
    showGameLoadoutDetails$.next(undefined);
  };
  const allItems = useSelector(allItemsSelector);
  const handleSaveAsDIM = () => {
    const dimLoadout = convertInGameLoadoutToDimLoadout(loadout, store.classType, allItems);
    editLoadout(dimLoadout, store.id, { isNew: true });
  };
  const handleShare = () => {
    const dimLoadout = convertInGameLoadoutToDimLoadout(loadout, store.classType, allItems);
    onShare(dimLoadout);
  };

  const header = (
    <div className={styles.header}>
      <InGameLoadoutIconWithIndex loadout={loadout} />
      <h1>{loadout.name}</h1>
    </div>
  );

  return (
    <Sheet onClose={reset} header={header} sheetClassName={styles.sheet}>
      <div className={styles.controls}>
        <button
          type="button"
          className="dim-button"
          onClick={() => dispatch(applyInGameLoadout(loadout))}
        >
          {t('LoadoutBuilder.EquipItems')}
        </button>
        <button
          type="button"
          className="dim-button"
          onClick={() => dispatch(prepInGameLoadout(loadout))}
        >
          {t('InGameLoadout.PrepareEquip')}
        </button>
        <button type="button" className="dim-button" onClick={() => onEdit(loadout)}>
          {t('InGameLoadout.EditIdentifiers')}
        </button>
        <button type="button" className="dim-button" onClick={handleSaveAsDIM}>
          {t('Loadouts.SaveAsDIM')}
        </button>
        <button type="button" className="dim-button" onClick={handleShare}>
          {t('Loadouts.ShareLoadout')}
        </button>
        <ConfirmButton danger onClick={() => dispatch(deleteInGameLoadout(loadout))}>
          {t('InGameLoadout.ClearSlot', { index: loadout.index + 1 })}
        </ConfirmButton>
      </div>
      <div className={styles.loadoutGrid}>
        {gameLoadoutCompatibleBuckets.map((h) => {
          const realItem = itemsByBucketHash[h];
          const loadoutItem = loadout.items.find((i) => i.itemInstanceId === realItem?.id);
          if (!realItem || !loadoutItem) {
            return null;
          }
          const fakeItem = applySocketOverrides(
            itemCreationContext,
            realItem,
            loadoutItem.plugItemHashes
          );

          // don't display any sockets the game loadout doesn't have data for
          const validSocketIndexes: number[] = [];
          for (
            let socketIndex = 0;
            socketIndex < loadoutItem.plugItemHashes.length;
            socketIndex++
          ) {
            const plugHash = loadoutItem.plugItemHashes[socketIndex];
            if (isValidGameLoadoutPlug(plugHash)) {
              validSocketIndexes.push(socketIndex);
            }
          }

          const cosmeticSocketIndexes =
            defs.InventoryItem.get(fakeItem.hash).sockets!.socketCategories.find(
              (sc) =>
                sc.socketCategoryHash === SocketCategoryHashes.ArmorCosmetics ||
                sc.socketCategoryHash === SocketCategoryHashes.WeaponCosmetics
            )?.socketIndexes ?? [];
          const validSockets = getSocketsByIndexes(fakeItem.sockets!, validSocketIndexes).filter(
            (socket) => socket.socketDefinition.socketTypeHash
          );
          const [smallSockets, bigSockets] = _.partition(
            validSockets,
            (s) =>
              cosmeticSocketIndexes.includes(s.socketIndex) ||
              (s.plugged!.plugDef.itemCategoryHashes?.includes(ItemCategoryHashes.SubclassMods) &&
                !(
                  s.plugged!.plugDef.plug.plugCategoryIdentifier.endsWith('.fragments') ||
                  s.plugged!.plugDef.plug.plugCategoryIdentifier.endsWith('.aspects')
                ))
          );
          return (
            <React.Fragment key={fakeItem.id}>
              <BungieImage src={fakeItem.icon} className={styles.itemImage} />
              {bigSockets.map((socket) => (
                <Socket key={socket.socketIndex} item={fakeItem} socket={socket} pluggedOnly />
              ))}
              <div className={styles.smallSockets}>
                {smallSockets.map((socket) => (
                  <Socket key={socket.socketIndex} item={fakeItem} socket={socket} pluggedOnly />
                ))}
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </Sheet>
  );
}
