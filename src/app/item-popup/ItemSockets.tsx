import clsx from 'clsx';
import { memo, useState } from 'react';
import { DimItem, DimPlug, DimSocket } from '../inventory/item-types';
import styles from './ItemSockets.m.scss';
import ItemSocketsGeneral from './ItemSocketsGeneral';
import ItemSocketsWeapons from './ItemSocketsWeapons';
import SocketDetails from './SocketDetails';

export type PlugClickHandler = (
  item: DimItem,
  socket: DimSocket,
  plug: DimPlug,
  hasMenu: boolean,
) => void;

export default memo(function ItemSockets({
  item,
  minimal,
  grid,
  onPlugClicked,
}: {
  item: DimItem;
  /** minimal style used for compare */
  minimal?: boolean;
  /** Force grid style */
  grid?: boolean;
  onPlugClicked?: (value: { item: DimItem; socket: DimSocket; plugHash: number }) => void;
}) {
  const [socketInMenu, setSocketInMenu] = useState<DimSocket | null>(null);

  const handlePlugClick: PlugClickHandler = (item, socket, plug, hasMenu) => {
    if (hasMenu) {
      setSocketInMenu(socket);
    } else {
      onPlugClicked?.({
        item,
        socket,
        plugHash: plug.plugDef.hash,
      });
    }
  };

  const content =
    item.destinyVersion === 2 && item.bucket.inWeapons ? (
      <ItemSocketsWeapons
        item={item}
        minimal={minimal}
        grid={grid}
        onPlugClicked={handlePlugClick}
      />
    ) : (
      <ItemSocketsGeneral item={item} minimal={minimal} onPlugClicked={handlePlugClick} />
    );
  return (
    <>
      {content}
      {socketInMenu && (
        <SocketDetails
          key={socketInMenu.socketIndex}
          item={item}
          socket={socketInMenu}
          allowInsertPlug
          onClose={() => setSocketInMenu(null)}
          onPlugSelected={onPlugClicked}
        />
      )}
    </>
  );
});

export function ItemSocketsList({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={clsx(className, styles.itemSockets)}>{children}</div>;
}
