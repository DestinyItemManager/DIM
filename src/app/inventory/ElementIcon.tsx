import React from 'react';
import BungieImage from 'app/dim-ui/BungieImage';
import styles from './ElementIcon.m.scss';
import clsx from 'clsx';
import { DestinyDamageTypeDefinition, DestinyEnergyTypeDefinition } from 'bungie-api-ts/destiny2';
import { D1DamageType } from './item-types';

export default function ElementIcon({
  element,
  className
}: {
  element: DestinyDamageTypeDefinition | DestinyEnergyTypeDefinition | D1DamageType | null;
  className?: string;
}) {
  return (
    (element && (
      <BungieImage
        className={clsx(className, styles.element)}
        src={isD1(element) ? element.iconPath : element.displayProperties.icon}
      />
    )) ??
    null
  );
}

function isD1(element: any): element is D1DamageType {
  return Boolean(element.iconPath);
}
