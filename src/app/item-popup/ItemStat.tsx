import React from 'react';
import { DimStat, DimItem, D1Stat, D1Item } from 'app/inventory/item-types';
import { statsMs } from 'app/inventory/store/stats';
import RecoilStat from './RecoilStat';
import { percent, getColor } from 'app/shell/filters';
import clsx from 'clsx';
import BungieImage from 'app/dim-ui/BungieImage';
import idx from 'idx';
import _ from 'lodash';
import { t } from 'app/i18next-t';
import styles from './ItemStat.m.scss';
import ExternalLink from 'app/dim-ui/ExternalLink';
import { AppIcon, helpIcon } from 'app/shell/icons';

/**
 * A single stat line.
 */
export default function ItemStat({ stat, item }: { stat: DimStat; item: DimItem }) {
  const value = stat.value;
  const isMasterworkedStat =
    item.isDestiny2() && item.masterworkInfo && stat.statHash === item.masterworkInfo.statHash;
  const masterworkValue =
    (item.isDestiny2() && item.masterworkInfo && item.masterworkInfo.statValue) || 0;

  const moddedStatValue = getModdedStatValue(item, stat);
  const isModdedStat = moddedStatValue !== 0;

  let baseBar = value;
  if (isMasterworkedStat && masterworkValue > 0) {
    baseBar -= masterworkValue;
  }
  if (isModdedStat) {
    baseBar -= moddedStatValue;
  }

  const segments: [number, string?][] = [[baseBar]];

  if (isMasterworkedStat && masterworkValue > 0) {
    segments.push([masterworkValue, styles.masterworkStatBar]);
  }
  if (isModdedStat) {
    segments.push([moddedStatValue, styles.moddedStatBar]);
  }

  const displayValue = value;

  return (
    <div
      className={clsx(styles.row, {
        [styles.masterworked]: isMasterworkedStat,
        [styles.modded]: isModdedStat
      })}
      title={stat.displayProperties.description}
    >
      <span className={styles.statName}>{stat.displayProperties.name}</span>

      <span className={styles.value}>
        {stat.additive && '+'}
        {displayValue}
      </span>

      {statsMs.includes(stat.statHash) && <span>{t('Stats.Milliseconds')}</span>}

      {stat.displayProperties.hasIcon && (
        <span className={styles.icon}>
          <BungieImage src={stat.displayProperties.icon} />
        </span>
      )}

      {isD1Stat(item, stat) && stat.qualityPercentage && stat.qualityPercentage.min > 0 && (
        <span className={styles.quality} style={getColor(stat.qualityPercentage.min, 'color')}>
          ({stat.qualityPercentage.range})
        </span>
      )}

      {stat.statHash === 2715839340 && (
        <span className={styles.statBar}>
          <RecoilStat stat={stat} />
        </span>
      )}

      {stat.bar && (
        <span className={styles.statBar}>
          <span className={styles.barContainer}>
            {segments.map(([val, className], index) => (
              <span
                key={index}
                className={clsx(styles.barInner, className)}
                style={{ width: percent(val / stat.maximumValue) }}
              />
            ))}
          </span>
        </span>
      )}
    </div>
  );
}

/**
 * A special stat row for D1 items that have item quality calculations
 */
export function D1QualitySummaryStat({ item }: { item: D1Item }) {
  if (!item.quality) {
    return null;
  }
  return (
    <div className={styles.row}>
      <span className={styles.statName}>{t('Stats.Quality')}</span>
      <span className={styles.qualitySummary} style={getColor(item.quality.min, 'color')}>
        {t('Stats.OfMaxRoll', { range: item.quality.range })}
        <ExternalLink
          href="https://github.com/DestinyItemManager/DIM/wiki/View-how-good-the-stat-(Int-Dis-Str)-roll-on-your-armor-is"
          title={t('Stats.PercentHelp')}
        >
          <AppIcon icon={helpIcon} />
        </ExternalLink>
      </span>
    </div>
  );
}

/*
 * Looks through the item sockets to find any weapon/armor mods that modify this stat (could be
 * multiple armor mods as of Shadowkeep). Returns the total value the stat is modified by, or 0 if
 * it is not being modified.
 */
function getModdedStatValue(item: DimItem, stat: DimStat) {
  const modSockets =
    (item.isDestiny2() &&
      item.sockets &&
      item.sockets.sockets.filter((socket) => {
        const categories = idx(socket, (socket) => socket.plug.plugItem.itemCategoryHashes) || [];
        return (
          // these are the item category hashes for weapon mods and armor mods respectively
          (categories.includes(1052191496) || categories.includes(4062965806)) &&
          // we only care about the ones that modify this stat
          Object.keys(idx(socket, (socket) => socket.plug.stats) || {}).includes(
            String(stat.statHash)
          )
        );
      })) ||
    [];

  return _.sum(
    modSockets.map((socket) =>
      socket.plug && socket.plug.stats ? socket.plug.stats[stat.statHash] : 0
    )
  );
}

export function isD1Stat(item: DimItem, _stat: DimStat): _stat is D1Stat {
  return item.isDestiny1();
}
