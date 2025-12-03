import { useD2Definitions } from 'app/manifest/selectors';
import { isKillTrackerSocket } from 'app/utils/item-utils';
import { getSocketsByIndexes } from 'app/utils/socket-utils';
import { wishListSelector } from 'app/wishlists/selectors';
import clsx from 'clsx';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import { DimItem, DimPlug, DimSocket, DimSocketCategory } from '../inventory/item-types';
import { InventoryWishListRoll } from '../wishlists/wishlists';
import * as styles from './ItemPerksList.m.scss';
import { PlugClickHandler } from './ItemSockets';
import { PerkCircleWithTooltip } from './Plug';
import { DimPlugTooltip } from './PlugTooltip';

/**
 * The list-style, vertical display of perks for a weapon.
 */
export default function ItemPerksList({
  item,
  perks,
  onClick,
}: {
  item: DimItem;
  perks: DimSocketCategory;
  onClick?: PlugClickHandler;
}) {
  const defs = useD2Definitions();
  const wishlistRoll = useSelector(wishListSelector(item));

  const [selectedPerk, setSelectedPerk] = useState<{ socketIndex: number; perkHash: number }>();
  const onPerkSelected = (socket: DimSocket, perk: DimPlug) => {
    if (selectedPerk?.perkHash === perk.plugDef.hash) {
      setSelectedPerk(undefined);
    } else {
      setSelectedPerk({ socketIndex: socket.socketIndex, perkHash: perk.plugDef.hash });
    }
    onClick?.(item, socket, perk, false);
  };

  if (!perks.socketIndexes || !defs || !item.sockets) {
    return null;
  }

  const socketIndices = perks.socketIndexes.toReversed();
  const sockets = getSocketsByIndexes(item.sockets, socketIndices);

  return (
    <div className={styles.sockets}>
      {sockets.map(
        (socketInfo) =>
          !isKillTrackerSocket(socketInfo) && (
            <PerkSocket
              key={socketInfo.socketIndex}
              item={item}
              socket={socketInfo}
              wishlistRoll={wishlistRoll}
              selectedPerk={selectedPerk}
              onPerkSelected={onPerkSelected}
            />
          ),
      )}
    </div>
  );
}

function PerkSocket({
  item,
  socket,
  wishlistRoll,
  selectedPerk,
  onPerkSelected,
}: {
  item: DimItem;
  socket: DimSocket;
  wishlistRoll?: InventoryWishListRoll;
  selectedPerk?: { socketIndex: number; perkHash: number };
  onPerkSelected: (socketInfo: DimSocket, plug: DimPlug) => void;
}) {
  if (!socket.plugOptions.length) {
    return null;
  }

  return (
    <div className={styles.socket}>
      {socket.plugOptions.map((plug) => (
        <PerkPlug
          key={plug.plugDef.hash}
          plug={plug}
          item={item}
          socketInfo={socket}
          wishlistRoll={wishlistRoll}
          selectedSocket={selectedPerk?.socketIndex === socket.socketIndex}
          selectedPerk={selectedPerk?.perkHash === plug.plugDef.hash}
          onPerkSelected={onPerkSelected}
        />
      ))}
    </div>
  );
}

function PerkPlug({
  item,
  plug,
  socketInfo,
  wishlistRoll,
  selectedSocket,
  selectedPerk,
  onPerkSelected,
}: {
  item: DimItem;
  plug: DimPlug;
  socketInfo: DimSocket;
  wishlistRoll?: InventoryWishListRoll;
  /* True, false, or undefined for "no selection" */
  // TODO: maybe use an enum
  selectedSocket: boolean;
  selectedPerk: boolean;
  onPerkSelected: (socketInfo: DimSocket, plug: DimPlug) => void;
}) {
  if (!plug.plugDef.plug) {
    return null;
  }

  const perkSelected = () => onPerkSelected(socketInfo, plug);
  const selected = plug === socketInfo.plugged;

  return (
    <div
      key={plug.plugDef.hash}
      className={clsx(styles.plug, {
        [styles.disabled]: !plug.enabled,
        [styles.selected]: selected,
      })}
      onClick={perkSelected}
    >
      <div className={styles.perkIconWrapper}>
        <PerkCircleWithTooltip
          item={item}
          plug={plug}
          wishlistRoll={wishlistRoll}
          socketInfo={socketInfo}
        />
      </div>
      {selectedPerk ? (
        <div className={styles.perkInfo}>
          <DimPlugTooltip item={item} plug={plug} wishlistRoll={wishlistRoll} />
        </div>
      ) : (
        selected &&
        !selectedSocket && (
          <div className={styles.perkInfo}>
            <h2 className={styles.plugLabel}>{plug.plugDef.displayProperties.name}</h2>
          </div>
        )
      )}
    </div>
  );
}
