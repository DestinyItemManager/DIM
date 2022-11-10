import { clarityAttribute } from 'app/clarity/integration/attributes';
import { DimItem, DimPlug, DimSocket } from 'app/inventory/item-types';
import clsx from 'clsx';
import React from 'react';
import styles from './ArchetypeSocket.m.scss';
import Socket from './Socket';

/**
 * A special socket display for the "archetype" socket (or exotic perk) and
 */
export default function ArchetypeSocket({
  archetypeSocket,
  item,
  children,
  onClick,
}: {
  archetypeSocket?: DimSocket;
  item: DimItem;
  children?: React.ReactNode;
  onClick?(item: DimItem, socket: DimSocket, plug: DimPlug, hasMenu: boolean): void;
}) {
  if (!archetypeSocket?.plugged) {
    return null;
  }

  return (
    <>
      <div className={styles.mod}>
        <Socket
          key={archetypeSocket.socketIndex}
          item={item}
          socket={archetypeSocket}
          onClick={onClick}
        />
      </div>
      <div className={styles.info}>
        <div className={styles.name}>{archetypeSocket.plugged.plugDef.displayProperties.name}</div>
        {children}
      </div>
    </>
  );
}

export function ArchetypeRow({
  className,
  children,
  minimal,
  isWeapons,
  item,
}: {
  className?: string;
  children: React.ReactNode;
  minimal?: boolean;
  isWeapons?: boolean;
  item?: DimItem;
}) {
  return (
    <div
      className={clsx(className, styles.row, {
        [styles.minimal]: minimal,
        [styles.isWeapons]: isWeapons,
      })}
      {...clarityAttribute('perks', item)}
    >
      {children}
    </div>
  );
}
