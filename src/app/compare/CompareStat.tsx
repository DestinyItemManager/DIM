import AnimatedNumber from 'app/dim-ui/AnimatedNumber';
import { EnergyCostIcon } from 'app/dim-ui/ElementIcon';
import { t } from 'app/i18next-t';
import RecoilStat, { recoilValue } from 'app/item-popup/RecoilStat';
import { getColor, percent } from 'app/shell/formatters';
import { StatHashes } from 'data/d2/generated-enums';
import { D1Stat, DimItem, DimStat } from '../inventory/item-types';
import { MinimalStat, StatInfo } from './Compare';
import styles from './CompareStat.m.scss';

export default function CompareStat({
  statInfo,
  stat,
  item,
  value,
}: {
  statInfo: StatInfo;
  stat: DimStat;
  item: DimItem;
  value: number | undefined;
}) {
  const color = getColor(statRange(stat, statInfo, value ?? 0), 'color');

  return (
    <div className={styles.stat} style={color}>
      {value !== 0 && value !== undefined && stat.bar && item.bucket.sort === 'Armor' && (
        <span className={styles.bar}>
          <span style={{ width: percent(value / stat.maximumValue) }} />
        </span>
      )}
      {stat.statHash === StatHashes.AnyEnergyTypeCost && stat && item.energy && <EnergyCostIcon />}
      {value !== undefined ? (
        stat.statHash === StatHashes.RecoilDirection ? (
          <span className={styles.recoil}>
            <span>{value}</span>
            <RecoilStat value={value} />
          </span>
        ) : (
          <AnimatedNumber value={value} />
        )
      ) : (
        t('Stats.NotApplicable')
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
function statRange(
  stat: DimStat | D1Stat | MinimalStat | undefined,
  statInfo: StatInfo,
  value: number,
) {
  if (!stat) {
    return -1;
  }
  if ('qualityPercentage' in stat && stat.qualityPercentage) {
    return stat.qualityPercentage.min;
  }

  if (!statInfo.enabled) {
    return -1;
  }

  if (statInfo.stat.statHash === StatHashes.RecoilDirection) {
    return recoilValue(value);
  }

  if (statInfo.stat.smallerIsBetter) {
    return (100 * (statInfo.max - value)) / (statInfo.max - statInfo.min);
  }

  return (100 * (value - statInfo.min)) / (statInfo.max - statInfo.min);
}
