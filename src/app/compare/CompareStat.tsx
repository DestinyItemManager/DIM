import AnimatedNumber from 'app/dim-ui/AnimatedNumber';
import { EnergyCostIcon } from 'app/dim-ui/ElementIcon';
import { t } from 'app/i18next-t';
import RecoilStat, { recoilValue } from 'app/item-popup/RecoilStat';
import { getCompareColor, percent } from 'app/shell/formatters';
import { StatHashes } from 'data/d2/generated-enums';
import { D1Stat, DimItem, DimStat } from '../inventory/item-types';
import { MinimalStat, StatInfo } from './Compare';
import styles from './CompareStat.m.scss';

export default function CompareStat({
  stat: statInfo,
  compareBaseStats,
  item,
  setHighlight,
}: {
  stat: StatInfo;
  compareBaseStats?: boolean;
  item: DimItem;
  setHighlight: (value?: string | number) => void;
}) {
  const { stat, getStat } = statInfo;
  const itemStat = getStat(item);

  const color = getCompareColor(statRange(itemStat, statInfo, compareBaseStats));

  const statValue = itemStat
    ? ((compareBaseStats ? itemStat.base : itemStat.value) ?? itemStat.value)
    : 0;

  return (
    <div
      onPointerEnter={() => setHighlight(stat.statHash)}
      className={styles.stat}
      style={{ color }}
    >
      {statValue !== 0 && stat.bar && item.bucket.sort === 'Armor' && (
        <span className={styles.bar}>
          <span style={{ width: percent(statValue / stat.maximumValue) }} />
        </span>
      )}
      {stat.statHash === StatHashes.AnyEnergyTypeCost && itemStat && item.energy && (
        <EnergyCostIcon />
      )}
      {itemStat?.value !== undefined ? (
        statInfo.stat.statHash === StatHashes.RecoilDirection ? (
          <span className={styles.recoil}>
            <span>{statValue}</span>
            <RecoilStat value={statValue} />
          </span>
        ) : (
          <AnimatedNumber value={statValue} />
        )
      ) : (
        t('Stats.NotApplicable')
      )}
      {Boolean(itemStat?.value) &&
        (itemStat as D1Stat).qualityPercentage &&
        Boolean((itemStat as D1Stat).qualityPercentage!.range) && (
          <span className={styles.range}>({(itemStat as D1Stat).qualityPercentage!.range})</span>
        )}
    </div>
  );
}

// Turns a stat and a list of ranges into a 0-100 scale
function statRange(
  stat: DimStat | D1Stat | MinimalStat | undefined,
  statInfo: StatInfo,
  compareBaseStats = false,
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

  let statValue = (compareBaseStats ? stat.base : stat.value) ?? stat.value;

  if (statInfo.stat.statHash === StatHashes.RecoilDirection) {
    statValue = recoilValue(statValue);
  }

  if (statInfo.stat.smallerIsBetter) {
    return (100 * (statInfo.max - statValue)) / (statInfo.max - statInfo.min);
  }

  return (100 * (statValue - statInfo.min)) / (statInfo.max - statInfo.min);
}
