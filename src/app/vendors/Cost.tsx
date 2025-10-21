import BungieImage from 'app/dim-ui/BungieImage';
import { useD2Definitions } from 'app/manifest/selectors';
import { DestinyItemQuantity } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import * as styles from './Cost.m.scss';

/**
 * Display a single item + quantity as a "cost".
 */
export default function Cost({
  cost,
  className,
}: {
  cost: DestinyItemQuantity;
  className?: string;
}) {
  const defs = useD2Definitions()!;
  const currencyItem = defs.InventoryItem.get(cost.itemHash);
  if (!currencyItem) {
    return null;
  }
  return (
    <div
      className={clsx(styles.cost, className)}
      title={`${cost.quantity.toLocaleString()} ${currencyItem.displayProperties.name}`}
    >
      {cost.quantity.toLocaleString()}
      <BungieImage height={12} width={12} src={currencyItem.displayProperties.icon} />
    </div>
  );
}
