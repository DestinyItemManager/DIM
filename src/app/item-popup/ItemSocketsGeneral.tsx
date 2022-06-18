import ClarityDescriptions from 'app/clarity/descriptions/ClarityDescriptions';
import { settingSelector } from 'app/dim-api/selectors';
import RichDestinyText from 'app/dim-ui/RichDestinyText';
import { useD2Definitions } from 'app/manifest/selectors';
import { killTrackerSocketTypeHash } from 'app/search/d2-known-values';
import { getIntrinsicArmorPerkSocket, getSocketsByIndexes } from 'app/utils/socket-utils';
import { Portal } from 'app/utils/temp-container';
import { DestinySocketCategoryStyle } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import { SocketCategoryHashes } from 'data/d2/generated-enums';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import { DimItem, DimPlug, DimSocket } from '../inventory/item-types';
import { Settings } from '../settings/initial-settings';
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
  onPlugClicked?(value: { item: DimItem; socket: DimSocket; plugHash: number }): void;
}

export default function ItemSocketsGeneral({ item, minimal, onPlugClicked }: Props) {
  const defs = useD2Definitions();
  const wishlistRoll = useSelector(wishListSelector(item));
  const [socketInMenu, setSocketInMenu] = useState<DimSocket | null>(null);
  const descriptionsToDisplay = useSelector(settingSelector('descriptionsToDisplay'));

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
      c.category.uiCategoryStyle !== 2251952357
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

  const intrinsicArmorPerk = getIntrinsicArmorPerkDetails(
    intrinsicArmorPerkSocket,
    descriptionsToDisplay
  );
  return (
    <>
      {intrinsicArmorPerk && (
        <ArchetypeRow minimal={minimal}>
          <ArchetypeSocket
            archetypeSocket={intrinsicArmorPerk.socket}
            item={item}
            onClick={handleSocketClick}
          >
            {!minimal && (
              <div className={styles.armorIntrinsicDescription}>
                {intrinsicArmorPerk.description && (
                  <RichDestinyText text={intrinsicArmorPerk.description} />
                )}
                {intrinsicArmorPerk.communityInsight && (
                  <ClarityDescriptions
                    hash={intrinsicArmorPerk.communityInsight.hash}
                    fallback={
                      intrinsicArmorPerk.communityInsight.fallback && (
                        <RichDestinyText text={intrinsicArmorPerk.communityInsight.fallback} />
                      )
                    }
                    communityOnly={intrinsicArmorPerk.communityInsight.communityOnly}
                  />
                )}
              </div>
            )}
          </ArchetypeSocket>
        </ArchetypeRow>
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
              {getSocketsByIndexes(item.sockets!, category.socketIndexes).map(
                (socketInfo) =>
                  socketInfo.socketIndex !== intrinsicArmorPerk?.socket.socketIndex &&
                  socketInfo.socketDefinition.socketTypeHash !== killTrackerSocketTypeHash && (
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

function getIntrinsicArmorPerkDetails(
  socket: DimSocket | undefined,
  descriptionsToDisplay: Settings['descriptionsToDisplay']
) {
  if (!socket?.plugged) {
    return;
  }

  const showBungieDescription =
    !$featureFlags.clarityDescriptions || descriptionsToDisplay !== 'community';
  const showCommunityDescription =
    $featureFlags.clarityDescriptions && descriptionsToDisplay !== 'bungie';
  const showCommunityDescriptionOnly =
    $featureFlags.clarityDescriptions && descriptionsToDisplay === 'community';

  return {
    socket: socket,
    description: showBungieDescription && socket.plugged.plugDef.displayProperties.description,
    communityInsight: showCommunityDescription && {
      hash: socket.plugged.plugDef.hash,
      fallback: !showBungieDescription && socket.plugged.plugDef.displayProperties.description,
      communityOnly: showCommunityDescriptionOnly,
    },
  };
}
