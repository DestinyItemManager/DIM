import { DimItem, DimPlug, DimSocket } from 'app/inventory/item-types';
import { DefItemIcon } from 'app/inventory/ItemIcon';
import { DestinyInventoryItemDefinition } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import React from 'react';
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
  onClick?(item: DimItem, socket: DimSocket, plug: DimPlug, hasMenu: boolean): void;
}) {
  return (
    <table className={clsx(styles.emoteWheel, 'item-socket-category-Consumable socket-container')}>
      <tbody>
        <tr>
          <td />
          <td>
            <Socket item={item} socket={sockets[0]} onClick={onClick} />
          </td>
          <td />
        </tr>
        <tr>
          <td>
            <Socket item={item} socket={sockets[2]} onClick={onClick} />
          </td>
          <td>
            <DefItemIcon itemDef={itemDef} />
          </td>
          <td>
            <Socket item={item} socket={sockets[3]} onClick={onClick} />
          </td>
        </tr>
        <tr>
          <td />
          <td>
            <Socket item={item} socket={sockets[1]} onClick={onClick} />
          </td>
          <td />
        </tr>
      </tbody>
    </table>
  );
}
