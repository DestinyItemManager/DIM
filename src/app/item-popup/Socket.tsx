import { DimItem, DimSocket } from 'app/inventory/item-types';
import { InventoryWishListRoll } from 'app/wishlists/wishlists';
import clsx from 'clsx';
import { PlugClickHandler } from './ItemSockets';
import Plug from './Plug';
import * as styles from './Socket.m.scss';

/**
 * A socket may have multiple plugs - this can represent either a perk column or a mod socket.
 */
export default function Socket({
  item,
  socket,
  noTooltip,
  wishlistRoll,
  onClick,
  pluggedOnly = false,
  className,
}: {
  item: DimItem;
  socket: DimSocket;
  noTooltip?: boolean;
  wishlistRoll?: InventoryWishListRoll;
  onClick?: PlugClickHandler;
  pluggedOnly?: boolean;
  className?: string;
}) {
  const hasMenu = Boolean(onClick && !socket.isPerk && socket.socketDefinition.plugSources);
  if (!socket.plugOptions.length) {
    return null;
  }

  return (
    <div className={clsx(styles.socket, className)}>
      {socket.plugOptions.map(
        (plug) =>
          (!pluggedOnly || socket.plugged === plug) && (
            <Plug
              key={plug.plugDef.hash}
              plug={plug}
              item={item}
              socketInfo={socket}
              noTooltip={noTooltip}
              wishlistRoll={wishlistRoll}
              hasMenu={hasMenu}
              isMod={socket.isMod}
              onClick={onClick && (() => onClick(item, socket, plug, hasMenu))}
            />
          ),
      )}
    </div>
  );
}
