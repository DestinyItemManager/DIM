import { LockedItemType } from 'app/loadout-builder/types';
import {
  CHALICE_OF_OPULENCE,
  killTrackerSocketTypeHash,
  synthesizerHashes,
} from 'app/search/d2-known-values';
import { RootState, ThunkDispatchProp } from 'app/store/types';
import { DestinySocketCategoryStyle } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { connect } from 'react-redux';
import { DimAdjustedItemPlug } from '../compare/types';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions';
import { DimItem, DimPlug, DimSocket } from '../inventory/item-types';
import { inventoryWishListsSelector, wishListsEnabledSelector } from '../wishlists/selectors';
import { InventoryWishListRoll } from '../wishlists/wishlists';
import './ItemSockets.scss';
import Plug from './Plug';
import SocketDetails from './SocketDetails';

interface ProvidedProps {
  item: DimItem;
  /** minimal style used for loadout generator and compare */
  minimal?: boolean;
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

function ItemSocketsGeneral({
  defs,
  item,
  minimal,
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

  // special top level class for styling some specific items' popups differently
  const itemSpecificClass = synthesizerHashes.includes(item.hash)
    ? 'chalice' // to-do, maybe, someday: this should be 'synthesizer' but they share classes rn
    : item.hash === CHALICE_OF_OPULENCE
    ? 'chalice'
    : null;

  let categories = item.sockets.categories.filter(
    (c) =>
      // hide if there's no sockets in this category
      c.sockets.length > 0 &&
      // hide if this is the energy slot. it's already displayed in ItemDetails
      c.category.categoryStyle !== DestinySocketCategoryStyle.EnergyMeter
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

  return (
    <div className={clsx('item-details', 'sockets', { itemSpecificClass })}>
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
            {category.sockets.map(
              (socketInfo) =>
                socketInfo.socketDefinition.socketTypeHash !== killTrackerSocketTypeHash && (
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
      ))}
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

export default connect<StoreProps>(mapStateToProps)(ItemSocketsGeneral);

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
