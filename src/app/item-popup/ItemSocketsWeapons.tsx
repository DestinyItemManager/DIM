import { t } from 'app/i18next-t';
import { DimItem, DimPlug, DimSocket } from 'app/inventory/item-types';
import { craftedSocketCategoryHash } from 'app/inventory/store/crafted';
import { statsMs } from 'app/inventory/store/stats';
import { useD2Definitions } from 'app/manifest/selectors';
import { useSetting } from 'app/settings/hooks';
import { AppIcon, faGrid, faList } from 'app/shell/icons';
import { isKillTrackerSocket } from 'app/utils/item-utils';
import {
  getSocketByIndex,
  getSocketsByIndexes,
  getWeaponArchetypeSocket,
} from 'app/utils/socket-utils';
import { wishListSelector } from 'app/wishlists/selectors';
import { DestinySocketCategoryStyle } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import { ItemCategoryHashes, SocketCategoryHashes, StatHashes } from 'data/d2/generated-enums';
import _ from 'lodash';
import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { useSelector } from 'react-redux';
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
  grid?: boolean;
  onPlugClicked?(value: { item: DimItem; socket: DimSocket; plugHash: number }): void;
}

export default function ItemSocketsWeapons({ item, minimal, grid, onPlugClicked }: Props) {
  const defs = useD2Definitions();
  const wishlistRoll = useSelector(wishListSelector(item));
  const [socketInMenu, setSocketInMenu] = useState<DimSocket | null>(null);
  const [listPerks, setListPerks] = useSetting('perkList');

  const handleSocketClick = (item: DimItem, socket: DimSocket, plug: DimPlug, hasMenu: boolean) => {
    if (hasMenu) {
      setSocketInMenu(socket);
    } else {
      onPlugClicked?.({
        item,
        socket,
        plugHash: plug.plugDef.hash,
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
    .filter((c) => c.category.hash !== craftedSocketCategoryHash)
    .reverse()
    .flatMap((c) =>
      getSocketsByIndexes(item.sockets!, c.socketIndexes).filter(
        (s) => !s.isPerk && s !== archetypeSocket
      )
    )
    .filter(
      (socket) =>
        // Hack: dummy deepsight plugs with no name can be ignored
        socket.plugged?.plugDef.displayProperties.name ||
        socket.socketDefinition.socketTypeHash !== 1085237186
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
    />
  );

  return (
    <div className={clsx('sockets', styles.weaponSockets, { [styles.minimal]: minimal })}>
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
        (listPerks && !minimal && !grid ? (
          <div className={styles.perks}>
            {!minimal && !grid && (
              <button
                className={styles.displayStyleButton}
                type="button"
                title={t('Sockets.GridStyle')}
                onClick={() => setListPerks(false)}
              >
                <AppIcon icon={faGrid} />
              </button>
            )}
            <ItemPerksList item={item} perks={perks} onClick={handleSocketClick} />
          </div>
        ) : (
          <div className={clsx(categoryStyle(perks.category.categoryStyle), styles.perks)}>
            {!minimal && !grid && (
              <button
                className={styles.displayStyleButton}
                type="button"
                title={t('Sockets.ListStyle')}
                onClick={() => setListPerks(true)}
              >
                <AppIcon icon={faList} />
              </button>
            )}
            <div className={clsx('item-sockets', styles.grid)}>
              {getSocketsByIndexes(item.sockets, perks.socketIndexes).map(
                (socketInfo) =>
                  !isKillTrackerSocket(socketInfo) && (
                    <Socket
                      key={socketInfo.socketIndex}
                      item={item}
                      socket={socketInfo}
                      wishlistRoll={wishlistRoll}
                      onClick={handleSocketClick}
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
            allowInsertPlug
            onClose={() => setSocketInMenu(null)}
            onPlugSelected={onPlugClicked}
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
