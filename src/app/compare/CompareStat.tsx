import AnimatedNumber from 'app/dim-ui/AnimatedNumber';
import RecoilStat, { recoilValue } from 'app/item-popup/RecoilStat';
import { getCompareColor, percent } from 'app/shell/formatters';
import clsx from 'clsx';
import { StatHashes } from 'data/d2/generated-enums';
import { D1Stat, DimItem, DimStat } from '../inventory/item-types';
import styles from './CompareStat.m.scss';

export default function CompareStat({
  min,
  max,
  stat,
  item,
  value,
}: {
  stat?: DimStat | D1Stat;
  item: DimItem;
  value: number;
  min: number;
  max: number;
}) {
  const isMasterworkStat = Boolean(
    item?.bucket.inWeapons &&
      stat &&
      item.masterworkInfo?.stats?.some((s) => s.isPrimary && s.hash === stat.statHash),
  );
  const color = getCompareColor(statRange(stat, min, max, value));

  return (
    <div className={styles.stat} style={{ color }}>
      <AnimatedNumber
        value={value}
        className={clsx(styles.statValue, {
          [styles.masterwork]: isMasterworkStat,
          [styles.noMinWidth]: !stat || stat.statHash === StatHashes.AnyEnergyTypeCost,
        })}
      />
      {value !== 0 && stat?.bar && item.bucket.sort === 'Armor' && (
        <span className={styles.bar}>
          <span style={{ width: percent(value / stat.maximumValue) }} />
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
