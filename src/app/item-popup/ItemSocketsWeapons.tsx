import { LockedItemType } from 'app/loadout-builder/types';
import { RootState, ThunkDispatchProp } from 'app/store/types';
import { isKillTrackerSocket } from 'app/utils/item-utils';
import { DestinySocketCategoryStyle } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import { SocketCategoryHashes } from 'data/d2/generated-enums';
import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { connect } from 'react-redux';
import { DimAdjustedItemPlug } from '../compare/types';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions';
import { DimItem, DimPlug, DimSocket } from '../inventory/item-types';
import { inventoryWishListsSelector, wishListsEnabledSelector } from '../wishlists/selectors';
import { InventoryWishListRoll } from '../wishlists/wishlists';
import './ItemSockets.scss';
import styles from './ItemSocketsWeapons.m.scss';
import Plug from './Plug';
import SocketDetails from './SocketDetails';

interface ProvidedProps {
  item: DimItem;
  updateSocketComparePlug?(value: { item: DimItem; socket: DimSocket; plug: DimPlug }): void;
  adjustedItemPlugs?: DimAdjustedItemPlug;
  /** Extra CSS classes to apply to perks based on their hash */
  classesByHash?: { [plugHash: number]: string };
  onShiftClick?(lockedItem: LockedItemType): void;
}

interface StoreProps {
  wishListsEnabled?: boolean;
  inventoryWishListRoll?: InventoryWishListRoll;
  defs?: D2ManifestDefinitions;
  isPhonePortrait: boolean;
}

function mapStateToProps(state: RootState, { item }: ProvidedProps): StoreProps {
  return {
    wishListsEnabled: wishListsEnabledSelector(state),
    inventoryWishListRoll: inventoryWishListsSelector(state)[item.id],
    defs: state.manifest.d2Manifest,
    isPhonePortrait: state.shell.isPhonePortrait,
  };
}

type Props = ProvidedProps & StoreProps & ThunkDispatchProp;

function ItemSocketsWeapons({
  defs,
  item,
  wishListsEnabled,
  inventoryWishListRoll,
  classesByHash,
  isPhonePortrait,
  onShiftClick,
  updateSocketComparePlug,
  adjustedItemPlugs,
}: Props) {
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
  const archetype = item.sockets.categories.find(
    (c) => c.category.hash === SocketCategoryHashes.IntrinsicTraits
  )?.sockets[0];
  const perks = item.sockets.categories.find(
    (c) =>
      c.category.hash !== SocketCategoryHashes.IntrinsicTraits &&
      c.sockets.length &&
      c.sockets[0].isPerk
  );
  // Iterate in reverse category order so cosmetic mods are at the front
  const mods = [...item.sockets.categories]
    .reverse()
    .flatMap((c) => c.sockets.filter((s) => !s.isPerk && s !== archetype));

  return (
    <div className={clsx('item-details', 'sockets')}>
      <div className={clsx(styles.row, styles.archetype)}>
        {archetype?.plugged && (
          <div className={styles.archetypeMod}>
            <Socket
              key={archetype.socketIndex}
              defs={defs}
              item={item}
              isPhonePortrait={isPhonePortrait}
              socket={archetype}
              wishListsEnabled={wishListsEnabled}
              inventoryWishListRoll={inventoryWishListRoll}
              classesByHash={classesByHash}
              onClick={handleSocketClick}
              onShiftClick={onShiftClick}
              adjustedPlug={adjustedItemPlugs?.[archetype.socketIndex]}
            />
            {archetype.plugged.plugDef.displayProperties.name}
          </div>
        )}
        <div className="item-socket-category-Consumable socket-container">
          {mods.map((socketInfo) => (
            <Socket
              key={socketInfo.socketIndex}
              defs={defs}
              item={item}
              isPhonePortrait={isPhonePortrait}
              socket={socketInfo}
              wishListsEnabled={wishListsEnabled}
              inventoryWishListRoll={inventoryWishListRoll}
              classesByHash={classesByHash}
              onClick={handleSocketClick}
              onShiftClick={onShiftClick}
              adjustedPlug={adjustedItemPlugs?.[socketInfo.socketIndex]}
            />
          ))}
        </div>
      </div>
      {perks && (
        <div
          className={clsx(
            'item-socket-category',
            categoryStyle(perks.category.categoryStyle),
            styles.perks
          )}
        >
          <div className="item-sockets">
            {perks.sockets.map(
              (socketInfo) =>
                !isKillTrackerSocket(socketInfo) && (
                  <Socket
                    key={socketInfo.socketIndex}
                    defs={defs}
                    item={item}
                    isPhonePortrait={isPhonePortrait}
                    socket={socketInfo}
                    wishListsEnabled={wishListsEnabled}
                    inventoryWishListRoll={inventoryWishListRoll}
                    classesByHash={classesByHash}
                    onClick={handleSocketClick}
                    onShiftClick={onShiftClick}
                    adjustedPlug={adjustedItemPlugs?.[socketInfo.socketIndex]}
                  />
                )
            )}
          </div>
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

export default connect<StoreProps>(mapStateToProps)(ItemSocketsWeapons);

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

function Socket({
  defs,
  item,
  socket,
  wishListsEnabled,
  inventoryWishListRoll,
  classesByHash,
  isPhonePortrait,
  onClick,
  onShiftClick,
  adjustedPlug,
}: {
  defs: D2ManifestDefinitions;
  item: DimItem;
  socket: DimSocket;
  wishListsEnabled?: boolean;
  inventoryWishListRoll?: InventoryWishListRoll;
  /** Extra CSS classes to apply to perks based on their hash */
  classesByHash?: { [plugHash: number]: string };
  isPhonePortrait: boolean;
  onClick(item: DimItem, socket: DimSocket, plug: DimPlug, hasMenu: boolean): void;
  onShiftClick?(lockedItem: LockedItemType): void;
  adjustedPlug?: DimPlug;
}) {
  const hasMenu = Boolean(!socket.isPerk && socket.socketDefinition.plugSources);

  return (
    <div
      className={clsx('item-socket', {
        hasMenu,
      })}
    >
      {socket.plugOptions.map((plug) => (
        <Plug
          key={plug.plugDef.hash}
          plug={plug}
          item={item}
          socketInfo={socket}
          defs={defs}
          wishListsEnabled={wishListsEnabled}
          inventoryWishListRoll={inventoryWishListRoll}
          hasMenu={hasMenu}
          isPhonePortrait={isPhonePortrait}
          className={classesByHash?.[plug.plugDef.hash]}
          onClick={() => {
            onClick(item, socket, plug, hasMenu);
          }}
          onShiftClick={onShiftClick}
          adjustedPlug={adjustedPlug}
        />
      ))}
    </div>
  );
}
