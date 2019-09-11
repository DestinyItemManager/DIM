import React from 'react';
import { DimItem, DimStat, D1Stat } from '../inventory/item-types';
import classNames from 'classnames';
import { t } from 'app/i18next-t';
import './ItemStats.scss';
import { getColor, percent } from '../shell/filters';
import { AppIcon, helpIcon } from '../shell/icons';
import ExternalLink from '../dim-ui/ExternalLink';
import _ from 'lodash';
import RecoilStat from './RecoilStat';
import { statsMs } from 'app/inventory/store/stats';

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

// returns the socket associated with a mod that increases a displayed stat, specficially:
// backup mag (magazine size), counterbalance stock (recoil direction), and targeting adjustor (aim assist)
function modSocketFor(item) {
  return (
    item.sockets &&
    item.sockets.sockets.find((socket) => {
      return (
        socket.plug && [3336648220, 1588595445, 3228611386].includes(socket.plug.plugItem.hash)
      );
    })
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
  const value = stat.value;
  const compareStatValue = compareStat ? compareStat.value : 0;

  const isMasterworkedStat =
    item.isDestiny2() && item.masterworkInfo && stat.statHash === item.masterworkInfo.statHash;
  const masterworkValue =
    (item.isDestiny2() && item.masterworkInfo && item.masterworkInfo.statValue) || 0;

  const modSocket = modSocketFor(item);
  const isModdedStat = modSocket
    ? _.keys(modSocket.plug.stats).includes(String(stat.statHash))
    : false;
  const moddedStatValue = isModdedStat ? modSocket.plug.stats[stat.statHash] : 0;

  const statValueClasses = {
    'higher-stats': stat.smallerIsBetter
      ? value < compareStatValue && compareStat
      : value > compareStatValue && compareStat,
    'lower-stats': stat.smallerIsBetter
      ? value > compareStatValue && compareStat
      : value < compareStatValue && compareStat,
    'modded-stats': isModdedStat
  };

  let baseBar = compareStat ? Math.min(compareStatValue, value) : value;
  const segments: [number, string?][] = [[baseBar]];

  if (compareStat) {
    if (compareStatValue > value) {
      segments.push([compareStatValue - value, 'lower-stats']);
    } else if (value > compareStatValue) {
      segments.push([value - compareStatValue, 'higher-stats']);
    }
  }

  if (isMasterworkedStat && masterworkValue > 0) {
    baseBar -= masterworkValue;
    segments.push([masterworkValue, 'masterwork-stats']);
  }

  if (isModdedStat) {
    baseBar -= moddedStatValue;
    segments.push([moddedStatValue, 'modded-stats']);
  }

  const displayValue = statsMs.includes(stat.statHash) ? t('Stats.Milliseconds', { value }) : value;

  return (
    <div className="stat-box-row" title={stat.displayProperties.description}>
      <span
        className={classNames('stat-box-text', 'stat-box-cell', {
          'stat-box-masterwork': isMasterworkedStat,
          'stat-box-modded': isModdedStat
        })}
      >
        {stat.displayProperties.name}
      </span>

      {stat.statHash === 2715839340 ? (
        <span className="stat-recoil">
          <RecoilStat stat={stat} />
          <span className={classNames(statValueClasses)}>{value}</span>
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
              <span className={classNames(statValueClasses)}>{displayValue}</span>
            )}
          </span>
        </span>
      )}

      {stat.bar && (
        <span className={classNames('stat-box-val', 'stat-box-cell', statValueClasses)}>
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
