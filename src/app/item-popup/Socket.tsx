import { DimItem, DimPlug, DimSocket } from 'app/inventory/item-types';
import { compareBy } from 'app/utils/comparators';
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
  onClick,
}: {
  item: DimItem;
  socket: DimSocket;
  wishlistRoll?: InventoryWishListRoll;
  onClick?(item: DimItem, socket: DimSocket, plug: DimPlug, hasMenu: boolean): void;
}) {
  const hasMenu = Boolean(!socket.isPerk && socket.socketDefinition.plugSources);
  if (!socket.plugOptions.length) {
    return null;
  }
  let plugOptions = socket.plugOptions;

  // if this is a crafted item's plugset, sort plugs by their required level.
  // TO-DO: the order is correct in the original plugset def,
  // we should address whatever is changing plug order in DIM
  if (socket.craftingData) {
    plugOptions = [...plugOptions].sort(
      compareBy((p) => socket.craftingData![p.plugDef.hash]?.requiredLevel ?? 0)
    );
  }

  return (
    <div
      className={clsx('item-socket', {
        hasMenu,
      })}
    >
      {plugOptions.map((plug) => (
        <Plug
          key={plug.plugDef.hash}
          plug={plug}
          item={item}
          socketInfo={socket}
          wishlistRoll={wishlistRoll}
          hasMenu={hasMenu}
          onClick={onClick && (() => onClick(item, socket, plug, hasMenu))}
          craftingData={socket.craftingData?.[plug.plugDef.hash]}
        />
      ))}
    </div>
  );
}
