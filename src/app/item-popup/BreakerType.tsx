import BungieImage from 'app/dim-ui/BungieImage';
import { t } from 'app/i18next-t';
import { DimItem } from 'app/inventory/item-types';
import * as styles from './BreakerType.m.scss';

export default function BreakerType({ item }: { item: DimItem }) {
  const breakerType = item.breakerType;
  return (
    breakerType && (
      <BungieImage
        className={styles.breakerIcon}
        src={breakerType.displayProperties.icon}
        title={t('MovePopup.IntrinsicBreaker', {
          breaker: breakerType.displayProperties.name,
        })}
      />
    )
  );
}
