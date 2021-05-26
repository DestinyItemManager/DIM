import { DimItem, DimPlug, DimSocket } from 'app/inventory/item-types';
import { InventoryWishListRoll } from 'app/wishlists/wishlists';
import clsx from 'clsx';
import React from 'react';
import Plug from './Plug';

/**
 * A socket may have multiple plugs - this can represent either a perk column or a mod socket.
 */
export default function Socket({
  item,
  socket,
  wishlistRoll,
  isPhonePortrait,
  onClick,
  adjustedPlug,
}: {
  item: DimItem;
  socket: DimSocket;
  wishlistRoll?: InventoryWishListRoll;
  isPhonePortrait: boolean;
  onClick?(item: DimItem, socket: DimSocket, plug: DimPlug, hasMenu: boolean): void;
  adjustedPlug?: DimPlug;
}) {
  const hasMenu = Boolean(!socket.isPerk && socket.socketDefinition.plugSources);
  if (!socket.plugOptions.length) {
    return null;
  }
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
          wishlistRoll={wishlistRoll}
          hasMenu={hasMenu}
          isPhonePortrait={isPhonePortrait}
          onClick={onClick && (() => onClick(item, socket, plug, hasMenu))}
          adjustedPlug={adjustedPlug}
        />
      ))}
    </div>
  );
}
