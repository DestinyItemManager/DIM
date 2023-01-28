import { DimItem, DimPlug, DimSocket } from 'app/inventory/item-types';
import { InventoryWishListRoll } from 'app/wishlists/wishlists';
import clsx from 'clsx';
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
  onClick?: (item: DimItem, socket: DimSocket, plug: DimPlug, hasMenu: boolean) => void;
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
          onClick={onClick && (() => onClick(item, socket, plug, hasMenu))}
        />
      ))}
    </div>
  );
}
