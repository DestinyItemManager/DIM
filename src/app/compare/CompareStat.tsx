import AnimatedNumber from 'app/dim-ui/AnimatedNumber';
import { EnergyCostIcon } from 'app/dim-ui/ElementIcon';
import RecoilStat, { recoilValue } from 'app/item-popup/RecoilStat';
import { getColor, percent } from 'app/shell/formatters';
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
  stat: DimStat;
  item: DimItem;
  value: number;
  min: number;
  max: number;
}) {
  const color = getColor(statRange(stat, min, max, value), 'color');

  return (
    <div className={styles.stat} style={color}>
      {value !== 0 && stat.bar && item.bucket.sort === 'Armor' && (
        <span className={styles.bar}>
          <span style={{ width: percent(value / stat.maximumValue) }} />
        </span>
      )}
      {stat.statHash === StatHashes.AnyEnergyTypeCost && stat && item.energy && <EnergyCostIcon />}
      {stat.statHash === StatHashes.RecoilDirection ? (
        <span className={styles.recoil}>
          <span>{value}</span>
          <RecoilStat value={value} />
        </span>
      ) : (
        <AnimatedNumber value={value} />
      )}
      {Boolean(value) &&
        (stat as D1Stat).qualityPercentage &&
        Boolean((stat as D1Stat).qualityPercentage!.range) && (
          <span className={styles.range}>({(stat as D1Stat).qualityPercentage!.range})</span>
        )}
    </div>
  );
}

// Turns a stat and a list of ranges into a 0-100 scale
function statRange(stat: DimStat | D1Stat | undefined, min: number, max: number, value: number) {
  if (!stat) {
    return -1;
  }
  if ('qualityPercentage' in stat && stat.qualityPercentage) {
    return stat.qualityPercentage.min;
  }

  if (min === max) {
    return -1;
  }

  if (stat.statHash === StatHashes.RecoilDirection) {
    return recoilValue(value);
  }

  if (stat.smallerIsBetter) {
    return (100 * (max - value)) / (max - min);
  }

  return (100 * (value - min)) / (max - min);
}
