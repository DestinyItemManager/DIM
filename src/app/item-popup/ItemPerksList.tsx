import PressTip from 'app/dim-ui/PressTip';
import { t } from 'app/i18next-t';
import { DefItemIcon } from 'app/inventory/ItemIcon';
import { useD2Definitions } from 'app/manifest/selectors';
import { thumbsUpIcon } from 'app/shell/icons';
import AppIcon from 'app/shell/icons/AppIcon';
import { useIsPhonePortrait } from 'app/shell/selectors';
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
import DimPlugTooltip from './PlugTooltip';

interface Props {
  item: DimItem;
  perks: DimSocketCategory;
  onClick?(item: DimItem, socket: DimSocket, plug: DimPlug, hasMenu: boolean): void;
}

export default function ItemPerksList({ item, perks, onClick }: Props) {
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
  selectedPerk?: { socketIndex: number; perkHash: number };
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
  onPerkSelected(socketInfo: DimSocket, plug: DimPlug): void;
}) {
  const isPhonePortrait = useIsPhonePortrait();
  if (!plug.plugDef.plug) {
    return null;
  }

  const perkSelected = () => onPerkSelected(socketInfo, plug);
  const selected = plug === socketInfo.plugged;

  return (
    <div
      key={plug.plugDef.hash}
      className={clsx(styles.plug, {
        [styles.plugged]: socketInfo.actuallyPlugged
          ? plug === socketInfo.actuallyPlugged
          : plug === socketInfo.plugged,
        [styles.disabled]: !plug.enabled,
        [styles.selected]: selected,
        [styles.cannotRoll]: plug.cannotCurrentlyRoll,
      })}
      onClick={perkSelected}
    >
      <div className={styles.perkIcon}>
        {isPhonePortrait ? (
          <DefItemIcon itemDef={plug.plugDef} borderless={true} />
        ) : (
          <PressTip
            tooltip={<DimPlugTooltip item={item} plug={plug} wishlistRoll={wishlistRoll} />}
          >
            <DefItemIcon itemDef={plug.plugDef} borderless={true} />
          </PressTip>
        )}
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
