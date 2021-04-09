import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { DimItem, DimPlug, DimSocket } from 'app/inventory/item-types';
import { InventoryWishListRoll } from 'app/wishlists/wishlists';
import clsx from 'clsx';
import React from 'react';
import Plug from './Plug';

/**
 * A socket may have multiple plugs - this can represent either a perk column or a mod socket.
 */
export default function Socket({
  defs,
  item,
  socket,
  wishlistRoll,
  isPhonePortrait,
  onClick,
  adjustedPlug,
}: {
  defs: D2ManifestDefinitions;
  item: DimItem;
  socket: DimSocket;
  wishlistRoll?: InventoryWishListRoll;
  isPhonePortrait: boolean;
  onClick?(item: DimItem, socket: DimSocket, plug: DimPlug, hasMenu: boolean): void;
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
