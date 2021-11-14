import { DimItem } from 'app/inventory/item-types';
import { SocketOverrides } from 'app/inventory/store/override-sockets';
import React from 'react';
import LoadoutDrawerItem from '../LoadoutDrawerItem';
import ItemSocketsSubclass from './ItemSocketsSubclass';
import styles from './Subclass.m.scss';

export function Subclass({
  subclass,
  socketOverrides,
  updateSocketOverrides,
  equip,
  remove,
}: {
  subclass: DimItem;
  socketOverrides: SocketOverrides;
  equip(item: DimItem, e: React.MouseEvent<Element, MouseEvent>): void;
  remove(item: DimItem, e: React.MouseEvent<Element, MouseEvent>): void;
  updateSocketOverrides(socketOverrides: SocketOverrides): void;
}) {
  return (
    <div className={styles.container}>
      <LoadoutDrawerItem item={subclass} equip={equip} remove={remove} />
      <ItemSocketsSubclass
        subclass={subclass}
        socketOverrides={socketOverrides}
        updateSocketOverrides={updateSocketOverrides}
      />
    </div>
  );
}
