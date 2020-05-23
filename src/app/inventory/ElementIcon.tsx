import React from 'react';
import BungieImage from 'app/dim-ui/BungieImage';
import styles from './ElementIcon.m.scss';
import clsx from 'clsx';
import { DestinyDamageTypeDefinition, DestinyEnergyTypeDefinition } from 'bungie-api-ts/destiny2';

export default function ElementIcon({
  element,
  className,
}: {
  element: DestinyDamageTypeDefinition | DestinyEnergyTypeDefinition | null;
  className?: string;
}) {
  return (
    (element && (
      <BungieImage
        className={clsx(className, styles.element)}
        src={element.displayProperties.icon}
      />
    )) ??
    null
  );
}
