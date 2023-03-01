import { useD2Definitions } from 'app/manifest/selectors';
import { DestinyDamageTypeDefinition } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import { bungieBackgroundStyle } from './BungieImage';
import styles from './ElementIcon.m.scss';

export default function ElementIcon({
  element,
  className,
}: {
  element: DestinyDamageTypeDefinition | null;
  className?: string;
}) {
  if (!element) {
    return null;
  }

  const icon = element.displayProperties?.icon;
  if (!icon) {
    return null;
  }
  return <div style={bungieBackgroundStyle(icon)} className={clsx(className, styles.element)} />;
}

/**
 * The energy cost icon (a Masterwork hammer)
 */
export function EnergyCostIcon({ className }: { className?: string }) {
  const defs = useD2Definitions()!;

  const energyCostStat = defs.Stat.get(3578062600); // "Any Energy Type Cost"
  const icon = energyCostStat?.displayProperties.iconSequences[0].frames[3];

  if (!icon) {
    return null;
  }
  return <div style={bungieBackgroundStyle(icon)} className={clsx(className, styles.element)} />;
}
