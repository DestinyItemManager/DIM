import { DimItem, DimSocket } from 'app/inventory/item-types';
import { InventoryWishListRoll } from 'app/wishlists/wishlists';
import { PlugClickHandler } from './ItemSockets';
import Plug from './Plug';
import './Socket.scss';

/**
 * A socket may have multiple plugs - this can represent either a perk column or a mod socket.
 */
export default function Socket({
  item,
  socket,
  wishlistRoll,
  onClick,
  pluggedOnly = false,
}: {
  item: DimItem;
  socket: DimSocket;
  wishlistRoll?: InventoryWishListRoll;
  onClick?: PlugClickHandler;
  pluggedOnly?: boolean;
}) {
  const hasMenu = Boolean(onClick && !socket.isPerk && socket.socketDefinition.plugSources);
  if (!socket.plugOptions.length) {
    return null;
  }

  return (
    <div className="item-socket">
      {socket.plugOptions.map(
        (plug) =>
          (!pluggedOnly || socket.plugged === plug) && (
            <Plug
              key={plug.plugDef.hash}
              plug={plug}
              item={item}
              socketInfo={socket}
              wishlistRoll={wishlistRoll}
              hasMenu={hasMenu}
              isMod={socket.isMod}
              onClick={onClick && (() => onClick(item, socket, plug, hasMenu))}
            />
          )
      )}
    </div>
  );
}
