import RichDestinyText from 'app/dim-ui/destiny-symbols/RichDestinyText';
import { useD2Definitions } from 'app/manifest/selectors';
import clsx from 'clsx';
import BungieImage from '../dim-ui/BungieImage';
import { PressTip } from '../dim-ui/PressTip';
import styles from './ActivityModifier.m.scss';

export function ActivityModifier({
  modifierHash,
  small,
}: {
  modifierHash: number;
  small?: boolean;
}) {
  const defs = useD2Definitions()!;

  const modifier = defs.ActivityModifier.get(modifierHash);
  const modifierName = modifier.displayProperties.name;
  const modifierIcon = modifier.displayProperties.icon;

  if (!modifier?.displayInActivitySelection) {
    return null;
  }

  return (
    <div className={clsx(styles.modifier, { [styles.small]: small })}>
      {Boolean(modifierIcon) && <BungieImage src={modifierIcon} />}
      {Boolean(modifierName) && (
        <PressTip tooltip={<RichDestinyText text={modifier.displayProperties.description} />}>
          <div>{modifierName}</div>
        </PressTip>
      )}
    </div>
  );
}
