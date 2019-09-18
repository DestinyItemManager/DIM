import React from 'react';
import { DimStat, DimItem, D1Stat } from 'app/inventory/item-types';
import { statsMs } from 'app/inventory/store/stats';
import { t } from 'i18next';
import RecoilStat from './RecoilStat';
import { percent, getColor } from 'app/shell/filters';

/**
 * A single stat line.
 */
export default function ItemStat({
  stat,
  item,
  compareStat
}: {
  stat: DimStat;
  item: DimItem;
  compareStat?: DimStat;
}) {
  const value = stat.value;
  const compareStatValue = compareStat ? compareStat.value : 0;
  const isMasterworkedStat =
    item.isDestiny2() && item.masterworkInfo && stat.statHash === item.masterworkInfo.statHash;
  const masterworkValue =
    (item.isDestiny2() && item.masterworkInfo && item.masterworkInfo.statValue) || 0;
  const higherLowerClasses = {
    'higher-stats': stat.smallerIsBetter
      ? value < compareStatValue && compareStat
      : value > compareStatValue && compareStat,
    'lower-stats': stat.smallerIsBetter
      ? value > compareStatValue && compareStat
      : value < compareStatValue && compareStat
  };

  let baseBar = compareStat ? Math.min(compareStatValue, value) : value;
  if (isMasterworkedStat && masterworkValue > 0) {
    baseBar -= masterworkValue;
  }

  const segments: [number, string?][] = [[baseBar]];

  if (isMasterworkedStat && masterworkValue > 0) {
    segments.push([masterworkValue, 'masterwork-stats']);
  }

  if (compareStat) {
    if (compareStatValue > value) {
      segments.push([compareStatValue - value, 'lower-stats']);
    } else if (value > compareStatValue) {
      segments.push([value - compareStatValue, 'higher-stats']);
    }
  }

  const displayValue = statsMs.includes(stat.statHash) ? t('Stats.Milliseconds', { value }) : value;

  return (
    <div className="stat-box-row" title={stat.displayProperties.description}>
      <span
        className={classNames('stat-box-text', 'stat-box-cell', {
          'stat-box-masterwork': isMasterworkedStat
        })}
      >
        {stat.displayProperties.name}
      </span>

      {stat.statHash === 2715839340 ? (
        <span className="stat-recoil">
          <RecoilStat stat={stat} />
          <span className={classNames(higherLowerClasses)}>{value}</span>
        </span>
      ) : (
        <span className={classNames('stat-box-outer', { 'stat-box-outer--no-bar': !stat.bar })}>
          <span className="stat-box-container">
            {stat.bar ? (
              segments.map(([val, className], index) => (
                <span
                  key={index}
                  className={classNames('stat-box-inner', className)}
                  style={{ width: percent(val / stat.maximumValue) }}
                />
              ))
            ) : (
              <span className={classNames(higherLowerClasses)}>{displayValue}</span>
            )}
          </span>
        </span>
      )}

      {stat.bar && (
        <span className={classNames('stat-box-val', 'stat-box-cell', higherLowerClasses)}>
          {displayValue}
          {isD1Stat(item, stat) && stat.qualityPercentage && stat.qualityPercentage.min && (
            <span
              className="item-stat-quality"
              style={getColor(stat.qualityPercentage.min, 'color')}
            >
              ({stat.qualityPercentage.range})
            </span>
          )}
        </span>
      )}
    </div>
  );
}

function isD1Stat(item: DimItem, _stat: DimStat): _stat is D1Stat {
  return item.isDestiny1();
}
