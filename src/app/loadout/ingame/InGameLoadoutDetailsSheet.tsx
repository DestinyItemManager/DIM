import { D2Categories } from 'app/destiny2/d2-bucket-categories';
import BungieImage from 'app/dim-ui/BungieImage';
import { applySocketOverrides } from 'app/inventory/store/override-sockets';
import Socket from 'app/item-popup/Socket';
import { InGameLoadout } from 'app/loadout-drawer/loadout-types';
import { Observable } from 'app/utils/observable';
import { getSocketsByIndexes } from 'app/utils/socket-utils';
import { BucketHashes, ItemCategoryHashes, SocketCategoryHashes } from 'data/d2/generated-enums';
import _ from 'lodash';
import React from 'react';
import { useSelector } from 'react-redux';
import Sheet from '../../dim-ui/Sheet';
import { createItemContextSelector } from '../../inventory/selectors';
import styles from './InGameLoadoutDetailsSheet.m.scss';
import { InGameLoadoutIconWithIndex } from './InGameLoadoutIcon';
import { isValidGameLoadoutPlug, useItemsFromInGameLoadout } from './ingame-loadout-utils';

const gameLoadoutCompatibleBuckets = [
  BucketHashes.Subclass,
  ...D2Categories.Weapons,
  ...D2Categories.Armor,
];

export const showGameLoadoutDetails$ = new Observable<InGameLoadout | undefined>(undefined);

/** Show the gear power sheet */
export function showInGameLoadoutDetails(loadout: InGameLoadout) {
  showGameLoadoutDetails$.next(loadout);
}

export function InGameLoadoutDetails({
  // storeId,
  loadout,
}: {
  //   storeId: string;
  loadout: InGameLoadout;
}) {
  const itemCreationContext = useSelector(createItemContextSelector);
  const defs = itemCreationContext.defs;
  const items = useItemsFromInGameLoadout(loadout);
  const itemsByBucketHash = _.keyBy(items, (i) => i.bucket.hash);
  const reset = () => {
    showGameLoadoutDetails$.next(undefined);
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
        <button type="button" className="dim-button">
          apply
        </button>
        <button type="button" className="dim-button">
          delete
        </button>
        <button type="button" className="dim-button">
          edit identifiers
        </button>
        <button type="button" className="dim-button">
          save as DIM loadout
        </button>
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
            <React.Fragment key={realItem.id}>
              {/* <div className={styles.socketList} key={realItem.id}> */}
              <BungieImage src={realItem.icon} className={styles.itemImage} />
              {bigSockets.map((socket) => (
                <Socket key={socket.socketIndex} item={fakeItem} socket={socket} pluggedOnly />
              ))}
              <div className={styles.smallSockets}>
                {smallSockets.map((socket) => (
                  <Socket key={socket.socketIndex} item={fakeItem} socket={socket} pluggedOnly />
                ))}
              </div>
              {/* </div> */}
            </React.Fragment>
          );
        })}
      </div>
    </Sheet>
  );
}
