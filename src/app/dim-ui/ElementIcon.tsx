import { DestinyDamageTypeDefinition, DestinyEnergyTypeDefinition } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import { bungieBackgroundStyle } from './BungieImage';
import styles from './ElementIcon.m.scss';

export default function ElementIcon({
  element,
  className,
}: {
  element: DestinyDamageTypeDefinition | DestinyEnergyTypeDefinition | null;
  className?: string;
}) {
  const icon = element?.displayProperties?.icon;

  if (!icon) {
    return null;
  }
  return <div style={bungieBackgroundStyle(icon)} className={clsx(className, styles.element)} />;
}
