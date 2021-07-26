import { t } from 'app/i18next-t';
import { statsMs } from 'app/inventory/store/stats';
import { useD2Definitions } from 'app/manifest/selectors';
import { killTrackerSocketTypeHash } from 'app/search/d2-known-values';
import {
  getSocketByIndex,
  getSocketsByIndexes,
  getWeaponArchetypeSocket,
} from 'app/utils/socket-utils';
import { DestinySocketCategoryStyle } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import { ItemCategoryHashes, SocketCategoryHashes, StatHashes } from 'data/d2/generated-enums';
import _ from 'lodash';
import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { useSelector } from 'react-redux';
import { DimAdjustedItemPlug } from '../compare/types';
import { DimItem, DimPlug, DimSocket } from '../inventory/item-types';
import { wishListSelector } from '../wishlists/selectors';
import ArchetypeSocket, { ArchetypeRow } from './ArchetypeSocket';
import ItemPerksList from './ItemPerksList';
import './ItemSockets.scss';
import styles from './ItemSocketsWeapons.m.scss';
import Socket from './Socket';
import SocketDetails from './SocketDetails';

interface Props {
  item: DimItem;
  /** minimal style used for loadout generator and compare */
  minimal?: boolean;
  updateSocketComparePlug?(value: { item: DimItem; socket: DimSocket; plug: DimPlug }): void;
  adjustedItemPlugs?: DimAdjustedItemPlug;
}

export default function ItemSocketsWeapons({
  item,
  minimal,
  updateSocketComparePlug,
  adjustedItemPlugs,
}: Props) {
  const defs = useD2Definitions();
  const wishlistRoll = useSelector(wishListSelector(item));
  const [socketInMenu, setSocketInMenu] = useState<DimSocket | null>(null);

  const handleSocketClick = (item: DimItem, socket: DimSocket, plug: DimPlug, hasMenu: boolean) => {
    if (hasMenu) {
      setSocketInMenu(socket);
    } else if (updateSocketComparePlug) {
      updateSocketComparePlug({
        item,
        socket,
        plug,
      });
    }
  };

  if (!item.sockets || !defs) {
    return null;
  }

  // Separate out sockets. This gives us better display for things we know, but isn't as flexible to changes in how D2 works.
  const archetypeSocket = getWeaponArchetypeSocket(item);
  const perks = item.sockets.categories.find(
    (c) =>
      c.category.hash !== SocketCategoryHashes.IntrinsicTraits &&
      c.socketIndexes.length &&
      getSocketByIndex(item.sockets!, c.socketIndexes[0])?.isPerk
  );
  // Iterate in reverse category order so cosmetic mods are at the front
  const mods = [...item.sockets.categories]
    .reverse()
    .flatMap((c) =>
      getSocketsByIndexes(item.sockets!, c.socketIndexes).filter(
        (s) => !s.isPerk && s !== archetypeSocket
      )
    );

  const keyStats =
    item.stats &&
    !item.itemCategoryHashes.includes(ItemCategoryHashes.Sword) &&
    !item.itemCategoryHashes.includes(ItemCategoryHashes.LinearFusionRifles) &&
    _.take(item.stats, 2).filter(
      (s) => !statsMs.includes(s.statHash) && s.statHash !== StatHashes.BlastRadius
    );

  // Some stat labels are long. This lets us replace them with i18n
  const statLabels = {
    [StatHashes.RoundsPerMinute]: t('Organizer.Stats.RPM'),
  };

  const renderSocket = (socketInfo: DimSocket) => (
    <Socket
      key={socketInfo.socketIndex}
      item={item}
      socket={socketInfo}
      wishlistRoll={wishlistRoll}
      onClick={handleSocketClick}
      adjustedPlug={adjustedItemPlugs?.[socketInfo.socketIndex]}
    />
  );

  return (
    <div className={clsx('item-details', 'sockets', styles.weaponSockets)}>
      {(archetypeSocket?.plugged || (!minimal && mods.length > 0)) && (
        <ArchetypeRow minimal={minimal} isWeapons={true}>
          {archetypeSocket?.plugged && (
            <ArchetypeSocket archetypeSocket={archetypeSocket} item={item}>
              {!minimal && keyStats && keyStats.length > 0 && (
                <div className={styles.stats}>
                  {keyStats
                    ?.map(
                      (s) =>
                        `${s.value} ${(
                          statLabels[s.statHash] || s.displayProperties.name
                        ).toLowerCase()}`
                    )
                    ?.join(' / ')}
                </div>
              )}
            </ArchetypeSocket>
          )}
          {!minimal && mods.length > 0 && (
            <div className="item-socket-category-Consumable socket-container">
              {mods.map(renderSocket)}
            </div>
          )}
        </ArchetypeRow>
      )}
      {perks &&
        ($featureFlags.newPerks && !minimal ? (
          <ItemPerksList item={item} perks={perks} />
        ) : (
          <div
            className={clsx(
              'item-socket-category',
              categoryStyle(perks.category.categoryStyle),
              styles.perks
            )}
          >
            <div className="item-sockets">
              {getSocketsByIndexes(item.sockets, perks.socketIndexes).map(
                (socketInfo) =>
                  socketInfo.socketDefinition.socketTypeHash !== killTrackerSocketTypeHash && (
                    <Socket
                      key={socketInfo.socketIndex}
                      item={item}
                      socket={socketInfo}
                      wishlistRoll={wishlistRoll}
                      onClick={handleSocketClick}
                      adjustedPlug={adjustedItemPlugs?.[socketInfo.socketIndex]}
                    />
                  )
              )}
            </div>
          </div>
        ))}
      {minimal && mods.length > 0 && (
        <div className="item-socket-category-Consumable socket-container">
          {mods.map(renderSocket)}
        </div>
      )}
      {socketInMenu &&
        ReactDOM.createPortal(
          <SocketDetails
            key={socketInMenu.socketIndex}
            item={item}
            socket={socketInMenu}
            onClose={() => setSocketInMenu(null)}
          />,
          document.body
        )}
    </div>
  );
}

/** converts a socket category to a valid css class name */
function categoryStyle(categoryStyle: DestinySocketCategoryStyle) {
  switch (categoryStyle) {
    case DestinySocketCategoryStyle.Unknown:
      return 'item-socket-category-Unknown';
    case DestinySocketCategoryStyle.Reusable:
      return 'item-socket-category-Reusable';
    case DestinySocketCategoryStyle.Consumable:
      return 'item-socket-category-Consumable';
    case DestinySocketCategoryStyle.Unlockable:
      return 'item-socket-category-Unlockable';
    case DestinySocketCategoryStyle.Intrinsic:
      return 'item-socket-category-Intrinsic';
    case DestinySocketCategoryStyle.EnergyMeter:
      return 'item-socket-category-EnergyMeter';
    default:
      return null;
  }
}
