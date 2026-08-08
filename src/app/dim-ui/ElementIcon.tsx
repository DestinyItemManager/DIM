import { useD2Definitions } from 'app/manifest/selectors';
import { DamageType, DestinyDamageTypeDefinition } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import { bungieBackgroundStyle } from './BungieImage';
import * as styles from './ElementIcon.m.scss';

export default function ElementIcon({
  element,
  className,
  d1Badge,
  lightBackground,
}: {
  element: DestinyDamageTypeDefinition | null;
  className?: string;
  d1Badge?: boolean;
  /** Set if the element will be displayed on a light-colored background. */
  lightBackground?: boolean;
}) {
  if (!element) {
    return null;
  }

  const fixContrast =
    lightBackground &&
    (element.enumValue === DamageType.Arc ||
      element.enumValue === DamageType.Void ||
      element.enumValue === DamageType.Strand);
  const invert = lightBackground && element.enumValue === DamageType.Kinetic;

  const icon = element.displayProperties?.icon;
  if (!icon) {
    return null;
  }
  return (
    <div
      style={bungieBackgroundStyle(icon)}
      title={element.displayProperties.name}
      className={clsx(className, styles.element, {
        [styles.d1Badge]: d1Badge,
        [styles.fixContrast]: fixContrast,
        [styles.invert]: invert,
      })}
    />
  );
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
