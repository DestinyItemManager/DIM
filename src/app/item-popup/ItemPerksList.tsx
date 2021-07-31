import { t } from 'app/i18next-t';
import { DefItemIcon } from 'app/inventory/ItemIcon';
import { useD2Definitions } from 'app/manifest/selectors';
import { thumbsUpIcon } from 'app/shell/icons';
import AppIcon from 'app/shell/icons/AppIcon';
import { isKillTrackerSocket } from 'app/utils/item-utils';
import { getSocketsByIndexes } from 'app/utils/socket-utils';
import { wishListSelector } from 'app/wishlists/selectors';
import clsx from 'clsx';
import { default as React, useState } from 'react';
import { useSelector } from 'react-redux';
import { DimItem, DimPlug, DimSocket, DimSocketCategory } from '../inventory/item-types';
import { InventoryWishListRoll } from '../wishlists/wishlists';
import styles from './ItemPerksList.m.scss';
import './ItemSockets.scss';
import PlugTooltip from './PlugTooltip';

interface Props {
  item: DimItem;
  perks: DimSocketCategory;
}

export default function ItemPerksList({ item, perks }: Props) {
  // TODO: bring back clicking perks to see stats
  // TODO: click perk to see others
  // TODO: details?
  // TODO: tooltips
  // TODO: AWA buttons
  // TODO: grid for armor?
  const defs = useD2Definitions();
  const wishlistRoll = useSelector(wishListSelector(item));

  const [selectedPerk, setSelectedPerk] = useState<{ socket: DimSocket; perk: DimPlug }>();
  const onPerkSelected = (socket: DimSocket, perk: DimPlug) => {
    if (selectedPerk?.perk === perk) {
      setSelectedPerk(undefined);
    } else {
      setSelectedPerk({ socket, perk });
    }
  };

  if (!perks.socketIndexes || !defs || !item.sockets) {
    return null;
  }

  const socketIndices = [...perks.socketIndexes].reverse();
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
          )
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
  selectedPerk?: { socket: DimSocket; perk: DimPlug };
  onPerkSelected(socketInfo: DimSocket, plug: DimPlug): void;
}) {
  return (
    <div className={styles.socket}>
      {socket.plugOptions.map((plug) => (
        <PerkPlug
          key={plug.plugDef.hash}
          plug={plug}
          item={item}
          socketInfo={socket}
          wishlistRoll={wishlistRoll}
          selectedSocket={selectedPerk?.socket === socket}
          selectedPerk={selectedPerk?.perk === plug}
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
  onPerkSelected(socketInfo: DimSocket, plug: DimPlug): void;
}) {
  if (!plug.plugDef.plug) {
    return null;
  }

  const perkSelected = () => onPerkSelected(socketInfo, plug);
  const selected = selectedPerk || (plug === socketInfo.plugged && !selectedSocket);

  return (
    <div
      key={plug.plugDef.hash}
      className={clsx(styles.plug, {
        [styles.plugged]: plug === socketInfo.plugged,
        [styles.disabled]: !plug.enabled,
        [styles.selected]: selected,
      })}
      onClick={perkSelected}
    >
      <div className={styles.perkIcon}>
        <DefItemIcon itemDef={plug.plugDef} borderless={true} />
        {wishlistRoll?.wishListPerks.has(plug.plugDef.hash) && (
          <AppIcon
            className="thumbs-up"
            icon={thumbsUpIcon}
            title={t('WishListRoll.BestRatedTip')}
          />
        )}
      </div>
      {selectedPerk ? (
        <div className={styles.perkInfo}>
          <PlugTooltip item={item} plug={plug} wishlistRoll={wishlistRoll} />
        </div>
      ) : (
        selected && (
          <div className={styles.perkInfo}>
            <h2 className={styles.plugLabel}>{plug.plugDef.displayProperties.name}</h2>
          </div>
        )
      )}
    </div>
  );
}
