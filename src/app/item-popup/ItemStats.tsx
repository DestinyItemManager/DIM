import * as React from 'react';
import { DimItem, DimStat, D1Stat } from '../inventory/item-types';
import classNames from 'classnames';
import { t } from 'i18next';
import './ItemStats.scss';
import { percent } from '../inventory/dimPercentWidth.directive';
import { getColor } from '../shell/dimAngularFilters.filter';
import { AppIcon, helpIcon } from '../shell/icons';
import ExternalLink from '../dim-ui/ExternalLink';
import * as _ from 'lodash';

export default function ItemStats({
  item,
  /** Another item to compare stats against. Usually the equipped item. */
  compareItem
}: {
  item: DimItem;
  compareItem?: DimItem;
}) {
  if (!item.stats || !item.stats.length) {
    return null;
  }

  const compareStatsByStatHash = compareItem
    ? _.keyBy(compareItem.stats, (stat) => stat.statHash)
    : {};

  return (
    <div className="stats">
      {item.stats.map((stat) => (
        <ItemStatRow
          key={stat.statHash}
          stat={stat}
          item={item}
          compareStat={compareStatsByStatHash[stat.statHash]}
        />
      ))}

      {item.isDestiny1() && item.quality && item.quality.min && (
        <div className="stat-box-row">
          <span className="stat-box-text stat-box-cell stat-box-wrap">{t('Stats.Quality')}</span>
          <span className="stat-box-cell stat-box-wrap" style={getColor(item.quality.min, 'color')}>
            {t('Stats.OfMaxRoll', { range: item.quality.range })}
          </span>
          <ExternalLink
            href="https://github.com/DestinyItemManager/DIM/wiki/View-how-good-the-stat-(Int-Dis-Str)-roll-on-your-armor-is"
            title={t('Stats.PercentHelp')}
          >
            <AppIcon icon={helpIcon} />
          </ExternalLink>
        </div>
      )}
    </div>
  );
}

function ItemStatRow({
  stat,
  item,
  compareStat
}: {
  stat: DimStat;
  item: DimItem;
  compareStat?: DimStat;
}) {
  const value = stat.value || 0;
  const compareStatValue = (compareStat ? compareStat.value : 0) || 0;

  const isMasterworkedStat =
    item.isDestiny2() && item.masterworkInfo && stat.statHash === item.masterworkInfo.statHash;
  const masterworkValue =
    (item.isDestiny2() && item.masterworkInfo && item.masterworkInfo.statValue) || 0;

  const higherLowerClasses = {
    'higher-stats': value > compareStatValue && compareStat,
    'lower-stats': value < compareStatValue && compareStat
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

  return (
    <div className="stat-box-row">
      <span
        className={classNames('stat-box-text', 'stat-box-cell', {
          'stat-box-masterwork': isMasterworkedStat
        })}
      >
        {stat.name}
      </span>

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
            <span className={classNames(higherLowerClasses)}>{value}</span>
          )}
        </span>
      </span>

      {stat.bar && (
        <span className={classNames('stat-box-val', 'stat-box-cell', higherLowerClasses)}>
          {value}
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
