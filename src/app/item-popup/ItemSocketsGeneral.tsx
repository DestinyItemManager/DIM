import ClarityDescriptions from 'app/clarity/descriptions/ClarityDescriptions';
import RichDestinyText from 'app/dim-ui/destiny-symbols/RichDestinyText';
import { useD2Definitions } from 'app/manifest/selectors';
import { killTrackerSocketTypeHash } from 'app/search/d2-known-values';
import { usePlugDescriptions } from 'app/utils/plug-descriptions';
import {
  getIntrinsicArmorPerkSocket,
  getSocketsByIndexes,
  isEventArmorRerollSocket,
} from 'app/utils/socket-utils';
import { Portal } from 'app/utils/temp-container';
import { DestinySocketCategoryStyle } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import { SocketCategoryHashes } from 'data/d2/generated-enums';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import { DimItem, DimPlug, DimSocket, DimSocketCategory } from '../inventory/item-types';
import { wishListSelector } from '../wishlists/selectors';
import ArchetypeSocket, { ArchetypeRow } from './ArchetypeSocket';
import EmoteSockets from './EmoteSockets';
import './ItemSockets.scss';
import styles from './ItemSocketsGeneral.m.scss';
import Socket from './Socket';
import SocketDetails from './SocketDetails';

interface Props {
  item: DimItem;
  /** minimal style used for loadout generator and compare */
  minimal?: boolean;
  onPlugClicked?: (value: { item: DimItem; socket: DimSocket; plugHash: number }) => void;
}

export default function ItemSocketsGeneral({ item, minimal, onPlugClicked }: Props) {
  const defs = useD2Definitions();
  const wishlistRoll = useSelector(wishListSelector(item));
  const [socketInMenu, setSocketInMenu] = useState<DimSocket | null>(null);

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

  const intrinsicArmorPerkSocket = getIntrinsicArmorPerkSocket(item);
  const emoteWheelCategory = item.sockets.categories.find(
    (c) => c.category.hash === SocketCategoryHashes.Emotes
  );

  let categories = item.sockets.categories.filter(
    (c) =>
      // hide socket category if there's no sockets in this category after
      // removing the intrinsic armor perk socket, which we handle specially
      c.socketIndexes.some((s) => s !== intrinsicArmorPerkSocket?.socketIndex) &&
      // hide if this is the energy slot. it's already displayed in ItemDetails
      c.category.categoryStyle !== DestinySocketCategoryStyle.EnergyMeter &&
      // hide if this is the emote wheel because we show it separately
      c.category.hash !== SocketCategoryHashes.Emotes &&
      // Hidden sockets for intrinsic armor stats
      c.category.uiCategoryStyle !== 2251952357 &&
      getSocketsByIndexes(item.sockets!, c.socketIndexes).length > 0
  );
  if (minimal) {
    // Only show the first of each style of category
    const categoryStyles = new Set<DestinySocketCategoryStyle>();
    categories = categories.filter((c) => {
      if (!categoryStyles.has(c.category.categoryStyle)) {
        categoryStyles.add(c.category.categoryStyle);
        return true;
      }
      return false;
    });
  }

  // Pre-calculate the list of sockets we'll display for each category
  const socketsByCategory = new Map<DimSocketCategory, DimSocket[]>();
  for (const category of categories) {
    const sockets = getSocketsByIndexes(item.sockets, category.socketIndexes).filter(
      (socketInfo) =>
        // don't include armor intrinsics in automated socket listings
        socketInfo.socketIndex !== intrinsicArmorPerkSocket?.socketIndex &&
        // don't include these weird little solstice stat rerolling mechanic sockets
        !isEventArmorRerollSocket(socketInfo) &&
        // don't include kill trackers
        socketInfo.socketDefinition.socketTypeHash !== killTrackerSocketTypeHash
    );
    socketsByCategory.set(category, sockets);
  }

  // Remove categories where all the sockets were filtered out.
  categories = categories.filter((c) => socketsByCategory.get(c)?.length);

  return (
    <>
      {intrinsicArmorPerkSocket && (
        <IntrinsicArmorPerk
          item={item}
          socket={intrinsicArmorPerkSocket}
          minimal={minimal}
          handleSocketClick={handleSocketClick}
        />
      )}
      <div className={clsx('sockets', styles.generalSockets, { [styles.minimalSockets]: minimal })}>
        {emoteWheelCategory && (
          <EmoteSockets
            item={item}
            itemDef={defs.InventoryItem.get(item.hash)}
            sockets={emoteWheelCategory.socketIndexes.map((s) => item.sockets!.allSockets[s])}
            onClick={handleSocketClick}
          />
        )}
        {categories.map((category) => (
          <div
            key={category.category.hash}
            className={clsx('item-socket-category', categoryStyle(category.category.categoryStyle))}
          >
            {!minimal && (
              <div className="item-socket-category-name">
                {category.category.displayProperties.name}
              </div>
            )}
            <div className="item-sockets">
              {socketsByCategory.get(category)?.map((socketInfo) => (
                <Socket
                  key={socketInfo.socketIndex}
                  item={item}
                  socket={socketInfo}
                  wishlistRoll={wishlistRoll}
                  onClick={handleSocketClick}
                />
              ))}
            </div>
          </div>
        ))}
        {socketInMenu && (
          <Portal>
            <SocketDetails
              key={socketInMenu.socketIndex}
              item={item}
              socket={socketInMenu}
              allowInsertPlug
              onClose={() => setSocketInMenu(null)}
              onPlugSelected={onPlugClicked}
            />
          </Portal>
        )}
      </div>
    </>
  );
}

function IntrinsicArmorPerk({
  item,
  socket,
  minimal,
  handleSocketClick,
}: {
  item: DimItem;
  socket: DimSocket;
  minimal?: boolean;
  handleSocketClick: (item: DimItem, socket: DimSocket, plug: DimPlug, hasMenu: boolean) => void;
}) {
  const plugDescriptions = usePlugDescriptions(socket.plugged?.plugDef);
  return (
    <ArchetypeRow minimal={minimal}>
      <ArchetypeSocket archetypeSocket={socket} item={item} onClick={handleSocketClick}>
        {!minimal && (
          <div className={styles.armorIntrinsicDescription}>
            {plugDescriptions.perks.map(
              (perkDesc) =>
                perkDesc.description && (
                  <RichDestinyText key={perkDesc.perkHash} text={perkDesc.description} />
                )
            )}
            {plugDescriptions.communityInsight && (
              <ClarityDescriptions
                perk={plugDescriptions.communityInsight}
                className={styles.clarityDescription}
              />
            )}
          </div>
        )}
      </ArchetypeSocket>
    </ArchetypeRow>
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
