import { useD2Definitions } from 'app/manifest/selectors';
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
  const defs = useD2Definitions();

  if (!element) {
    return null;
  }

  let icon = element.displayProperties?.icon;

  // fall back to the cost stat's icon for armor energy - this is usually the Masterwork hammer icon
  if (!icon && defs && 'costStatHash' in element) {
    const energyCostStat = defs.Stat.get(element.costStatHash);
    icon = energyCostStat?.displayProperties.iconSequences[0].frames[3];
  }

  if (!icon) {
    return null;
  }
  return <div style={bungieBackgroundStyle(icon)} className={clsx(className, styles.element)} />;
}
