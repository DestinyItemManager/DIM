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
      <div className={styles.mod}>
        <Socket
          key={archetypeSocket.socketIndex}
          item={item}
          noTooltip={noTooltip}
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
}: {
  className?: string;
  children: React.ReactNode;
  minimal?: boolean;
  isWeapons?: boolean;
}) {
  return (
    <div
      className={clsx(className, styles.row, {
        [styles.minimal]: minimal,
        [styles.isWeapons]: isWeapons,
      })}
    >
      {children}
    </div>
  );
}
