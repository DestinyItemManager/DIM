import { DimItem, DimPlug, DimSocket } from 'app/inventory/item-types';
import { DefItemIcon } from 'app/inventory/ItemIcon';
import { DestinyInventoryItemDefinition } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import styles from './EmoteSockets.m.scss';
import Socket from './Socket';

/**
 * A special socket display for the emote sockets so that we
 * show the up/down/left/right emotes in their correct positions
 * instead of a flat list.
 */
export default function EmoteSockets({
  item,
  itemDef,
  sockets,
  onClick,
}: {
  item: DimItem;
  itemDef: DestinyInventoryItemDefinition;
  sockets: DimSocket[];
  onClick?: (item: DimItem, socket: DimSocket, plug: DimPlug, hasMenu: boolean) => void;
}) {
  const selectorIcon = <DefItemIcon itemDef={itemDef} />;

  return (
    <div className={clsx(styles.emoteWheel, 'item-socket-category-Consumable socket-container')}>
      {sockets.map((s, i) => (
        <div style={{ gridArea: `slot${i}` }} key={`${item.id}${s.socketIndex}`}>
          <Socket item={item} socket={s} onClick={onClick} />
        </div>
      ))}
      <div style={{ gridArea: 'collection' }}>{selectorIcon}</div>
    </div>
  );
}
