import { t } from 'app/i18next-t';
import { DefItemIcon } from 'app/inventory/ItemIcon';
import { thumbsUpIcon } from 'app/shell/icons';
import AppIcon from 'app/shell/icons/AppIcon';
import { RootState, ThunkDispatchProp } from 'app/store/types';
import { isKillTrackerSocket } from 'app/utils/item-utils';
import clsx from 'clsx';
import { default as React, useState } from 'react';
import { connect } from 'react-redux';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions';
import { DimItem, DimPlug, DimSocket, DimSocketCategory } from '../inventory/item-types';
import { inventoryWishListsSelector } from '../wishlists/selectors';
import { InventoryWishListRoll } from '../wishlists/wishlists';
import styles from './ItemPerksList.m.scss';
import './ItemSockets.scss';
import PlugTooltip from './PlugTooltip';

interface ProvidedProps {
  item: DimItem;
  perks: DimSocketCategory;
}

interface StoreProps {
  wishlistRoll?: InventoryWishListRoll;
  defs?: D2ManifestDefinitions;
}

function mapStateToProps(state: RootState, { item }: ProvidedProps): StoreProps {
  return {
    wishlistRoll: inventoryWishListsSelector(state)?.[item.id],
    defs: state.manifest.d2Manifest,
  };
}

type Props = ProvidedProps & StoreProps & ThunkDispatchProp;

function ItemPerksList({ defs, item, perks, wishlistRoll }: Props) {
  // TODO: bring back clicking perks to see stats
  // TODO: click perk to see others
  // TODO: details?
  // TODO: tooltips
  // TODO: AWA buttons
  // TODO: grid for armor?

  const [selectedPerk, setSelectedPerk] = useState<{ socket: DimSocket; perk: DimPlug }>();
  const onPerkSelected = (socket: DimSocket, perk: DimPlug) => {
    if (selectedPerk?.perk === perk) {
      setSelectedPerk(undefined);
    } else {
      setSelectedPerk({ socket, perk });
    }
  };

  if (!perks.sockets || !defs) {
    return null;
  }

  const sockets = [...perks.sockets].reverse();

  return (
    <div className={styles.sockets}>
      {sockets.map(
        (socketInfo) =>
          !isKillTrackerSocket(socketInfo) && (
            <PerkSocket
              key={socketInfo.socketIndex}
              defs={defs}
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

export default connect<StoreProps>(mapStateToProps)(ItemPerksList);

function PerkSocket({
  defs,
  item,
  socket,
  wishlistRoll,
  selectedPerk,
  onPerkSelected,
}: {
  defs: D2ManifestDefinitions;
  item: DimItem;
  socket: DimSocket;
  wishlistRoll?: InventoryWishListRoll;
  selectedPerk?: { socket: DimSocket; perk: DimPlug };
  onPerkSelected(socketInfo: DimSocket, plug: DimPlug);
}) {
  return (
    <div className={styles.socket}>
      {socket.plugOptions.map((plug) => (
        <PerkPlug
          key={plug.plugDef.hash}
          plug={plug}
          item={item}
          socketInfo={socket}
          defs={defs}
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
  defs,
  item,
  plug,
  socketInfo,
  wishlistRoll,
  selectedSocket,
  selectedPerk,
  onPerkSelected,
}: {
  defs: D2ManifestDefinitions;
  item: DimItem;
  plug: DimPlug;
  socketInfo: DimSocket;
  wishlistRoll?: InventoryWishListRoll;
  /* True, false, or undefined for "no selection" */
  // TODO: maybe use an enum
  selectedSocket: boolean;
  selectedPerk: boolean;
  onPerkSelected(socketInfo: DimSocket, plug: DimPlug);
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
        <DefItemIcon itemDef={plug.plugDef} defs={defs} borderless={true} />
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
          <PlugTooltip item={item} plug={plug} wishlistRoll={wishlistRoll} defs={defs} />
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
