import BungieImage from 'app/dim-ui/BungieImage';
import { t } from 'app/i18next-t';
import { DestinyBreakerTypeDefinition } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import * as styles from './BreakerTypeIcon.m.scss';

export default function BreakerType({
  breakerType,
  lightBackground,
  className,
}: {
  breakerType: DestinyBreakerTypeDefinition;
  lightBackground?: boolean;
  className?: string;
}) {
  return (
    <BungieImage
      className={clsx(className, styles.breakerIcon, { [styles.invert]: lightBackground })}
      src={breakerType.displayProperties.icon}
      title={t('MovePopup.IntrinsicBreaker', {
        breaker: breakerType.displayProperties.name,
      })}
    />
  );
}
