import AnimatedNumber from 'app/dim-ui/AnimatedNumber';
import RecoilStat, { recoilValue } from 'app/item-popup/RecoilStat';
import { getCompareColor, percent } from 'app/shell/formatters';
import { AppIcon, tunedStatIcon } from 'app/shell/icons';
import { artificeIcon } from 'app/shell/icons/custom/Artifice';
import { getArmor3TuningStat, isArtifice } from 'app/utils/item-utils';
import clsx from 'clsx';
import { StatHashes } from 'data/d2/generated-enums';
import { D1Stat, DimItem, DimStat } from '../inventory/item-types';
import * as styles from './CompareStat.m.scss';

export default function CompareStat({
  min,
  max,
  stat,
  item,
  value,
  relevantStatHashes,
  extraStatInfo = false,
}: {
  stat?: DimStat | D1Stat;
  item: DimItem;
  value: number;
  min: number;
  max: number;
  /** If this represents a custom stat, these are the real stats that custom stat includes. */
  relevantStatHashes?: number[];
  /** Whether to show extra stat info icons (e.g. that the total includes tuners, or that the stat is tuned) and stat bars. */
  extraStatInfo?: boolean;
}) {
  const isMasterworkStat = Boolean(
    item?.bucket.inWeapons &&
    stat &&
    item.masterworkInfo?.stats?.some((s) => s.isPrimary && s.hash === stat.statHash),
  );
  const color = getCompareColor(statRange(stat, min, max, value));
  const tunedStatHash = getArmor3TuningStat(item);
  // If this tuner benefits the custom stat, or this is a single real stat that's tunable
  const showTunerIcon =
    relevantStatHashes?.includes(tunedStatHash!) ||
    Boolean(tunedStatHash && tunedStatHash === stat?.statHash);
  const syntheticStat = Boolean(stat?.statHash && stat.statHash < 0);
  // If this is Artifice armor and a custom or Total stat
  const showArtificeIcon = isArtifice(item) && syntheticStat;
  const extraIcon = showTunerIcon ? tunedStatIcon : showArtificeIcon ? artificeIcon : undefined;
  const showBar = stat?.bar && item.bucket.inArmor;

  return (
    <div className={styles.stat} style={{ color }}>
      <AnimatedNumber
        value={value}
        className={clsx(styles.statValue, {
          [styles.masterwork]: isMasterworkStat,
          [styles.noMinWidth]: !stat || stat.statHash === StatHashes.AnyEnergyTypeCost,
        })}
      />
      {item.bucket.inArmor && extraStatInfo && (
        <span className={clsx(styles.statBarArea, showBar && styles.statBarContainer)}>
          {extraIcon && (
            <span
              className={clsx(styles.statExceptionIndicator, {
                [styles.customStat]: syntheticStat,
                [styles.smaller]: showArtificeIcon,
              })}
            >
              <AppIcon icon={extraIcon} />
              {showArtificeIcon && <sup>+</sup>}
            </span>
          )}
          {showBar && (
            <span
              className={styles.statBarFill}
              style={{ width: percent(Math.max(0, value) / stat.maximumValue) }}
            />
          )}
        </span>
      )}
      {stat?.statHash === StatHashes.RecoilDirection && <RecoilStat value={value} />}
      {Boolean(value) &&
        stat &&
        'qualityPercentage' in stat &&
        stat.qualityPercentage &&
        Boolean(stat.qualityPercentage.range) && (
          <span className={styles.range}>({stat.qualityPercentage.range})</span>
        )}
    </div>
  );
}

// Turns a stat and a list of ranges into a 0-100 scale
function statRange(stat: DimStat | D1Stat | undefined, min: number, max: number, value: number) {
  if (stat && 'qualityPercentage' in stat && stat.qualityPercentage) {
    return stat.qualityPercentage.min;
  }

  if (min === max) {
    return -1;
  }

  if (stat?.statHash === StatHashes.RecoilDirection) {
    value = recoilValue(value);
  }

  if (stat?.smallerIsBetter) {
    return (100 * (max - value)) / (max - min);
  }

  return (100 * (value - min)) / (max - min);
}
