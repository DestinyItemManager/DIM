import { DimItem, DimSocket } from 'app/inventory/item-types';
import clsx from 'clsx';
import React from 'react';
import styles from './ArchetypeSocket.m.scss';
import { PlugClickHandler } from './ItemSockets';
import Socket from './Socket';

/**
 * A special socket display for the "archetype" socket (or exotic perk) and
 */
export default function ArchetypeSocket({
  archetypeSocket,
  item,
  noTooltip,
  children,
  onClick,
}: {
  archetypeSocket?: DimSocket;
  item: DimItem;
  noTooltip?: boolean;
  children?: React.ReactNode;
  onClick?: PlugClickHandler;
}) {
  if (!archetypeSocket?.plugged) {
    return null;
  }

  return (
    <>
      <Socket
        key={archetypeSocket.socketIndex}
        className={styles.mod}
        item={item}
        noTooltip={noTooltip}
        socket={archetypeSocket}
        onClick={onClick}
      />
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
  isWeapons,
}: {
  className?: string;
  children: React.ReactNode;
  isWeapons?: boolean;
}) {
  return (
    <div
      className={clsx(className, styles.row, {
        [styles.isWeapons]: isWeapons,
      })}
    >
      {children}
    </div>
  );
}
