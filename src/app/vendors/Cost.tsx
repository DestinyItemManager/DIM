import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import BungieImage from 'app/dim-ui/BungieImage';
import { DestinyItemQuantity } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import React from 'react';
import styles from './Cost.m.scss';

/**
 * Display a single item + quantity as a "cost".
 */
export default function Cost({
  cost,
  defs,
  className,
}: {
  defs: D2ManifestDefinitions;
  cost: DestinyItemQuantity;
  className?: string;
}) {
  const currencyItem = defs.InventoryItem.get(cost.itemHash);
  return (
    <div
      className={clsx(styles.cost, className)}
      title={cost.quantity.toLocaleString() + ' ' + currencyItem.displayProperties.name}
    >
      {cost.quantity.toLocaleString()}
      <BungieImage src={currencyItem.displayProperties.icon} />
    </div>
  );
}
