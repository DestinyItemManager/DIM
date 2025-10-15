import { DefItemIcon } from 'app/inventory/ItemIcon';
import { DimItem, DimSocket } from 'app/inventory/item-types';
import { DestinyInventoryItemDefinition } from 'bungie-api-ts/destiny2';
import * as styles from './EmoteSockets.m.scss';
import { ItemSocketsList, PlugClickHandler } from './ItemSockets';
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
  onClick?: PlugClickHandler;
}) {
  const selectorIcon = <DefItemIcon itemDef={itemDef} className={styles.collectionIcon} />;

  return (
    <ItemSocketsList className={styles.emoteWheel}>
      {sockets.map((s, i) => (
        <div style={{ gridArea: `slot${i}` }} key={`${item.id}${s.socketIndex}`}>
          <Socket item={item} socket={s} onClick={onClick} />
        </div>
      ))}
      <div className="plug" style={{ gridArea: 'collection' }}>
        {selectorIcon}
      </div>
    </ItemSocketsList>
  );
}
