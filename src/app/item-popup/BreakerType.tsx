import BungieImage from 'app/dim-ui/BungieImage';
import { t } from 'app/i18next-t';
import { DimItem } from 'app/inventory/item-types';
import { useD2Definitions } from 'app/manifest/selectors';
import { getSeasonalBreakerTypeHash } from 'app/utils/item-utils';
import clsx from 'clsx';
import styles from './BreakerType.m.scss';

export default function BreakerType({ item }: { item: DimItem }) {
  const defs = useD2Definitions()!;
  let breakerType = item.breakerType;
  let breakerClass: string | undefined;
  if (!breakerType) {
    const breakerTypeHash = getSeasonalBreakerTypeHash(item);
    if (breakerTypeHash) {
      breakerType = defs.BreakerType.get(breakerTypeHash);
      breakerClass = styles.artifactBreaker;
    }
  }

  return (
    breakerType && (
      <BungieImage
        className={clsx(styles.breakerIcon, breakerClass)}
        src={breakerType.displayProperties.icon}
        title={
          breakerClass === styles.artifactBreaker
            ? t('MovePopup.ArtifactBreaker', {
                breaker: breakerType.displayProperties.name,
              })
            : t('MovePopup.IntrinsicBreaker', {
                breaker: breakerType.displayProperties.name,
              })
        }
      />
    )
  );
}
