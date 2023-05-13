import { DimItem, DimPlug, DimSocket } from 'app/inventory/item-types';
import { InventoryWishListRoll } from 'app/wishlists/wishlists';
import clsx from 'clsx';
import Plug from './Plug';
import styles from './Socket.m.scss';

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
  onClick?: (item: DimItem, socket: DimSocket, plug: DimPlug, hasMenu: boolean) => void;
  pluggedOnly?: boolean;
}) {
  const hasMenu = Boolean(onClick && !socket.isPerk && socket.socketDefinition.plugSources);
  if (!socket.plugOptions.length) {
    return null;
  }

  return (
    <div
      className={clsx('item-socket', {
        [styles.hasMenu]: hasMenu,
      })}
    >
      {socket.plugOptions
        .filter((plug) => !pluggedOnly || socket.plugged === plug)
        .map((plug) => (
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
