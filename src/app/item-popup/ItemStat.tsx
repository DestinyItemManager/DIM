import React from 'react';
import {
  DimStat,
  DimItem,
  D1Stat,
  D1Item,
  DimSocketCategory,
  DimSocket
} from 'app/inventory/item-types';
import { statsMs, armorStats } from 'app/inventory/store/stats';
import RecoilStat from './RecoilStat';
import { percent, getColor } from 'app/shell/filters';
import clsx from 'clsx';
import BungieImage from 'app/dim-ui/BungieImage';
import _ from 'lodash';
import { t } from 'app/i18next-t';
import styles from './ItemStat.m.scss';
import ExternalLink from 'app/dim-ui/ExternalLink';
import { AppIcon, helpIcon } from 'app/shell/icons';
import { DestinySocketCategoryStyle } from 'bungie-api-ts/destiny2';
import { getSocketsWithStyle } from '../utils/socket-utils';

// used in displaying the modded segments on item stats
const modItemCategoryHashes = [
  1052191496, // weapon mods
  4062965806, // armor mods (pre-2.0)
  4104513227 // armor 2.0 mods
];

const TOTAL_STAT_HASH = -1000;

/**
 * A single stat line.
 */
export default function ItemStat({ stat, item }: { stat: DimStat; item?: DimItem }) {
  const value = stat.value;
  const armor2MasterworkSockets =
    item?.isDestiny2() &&
    item.sockets &&
    getSocketsWithStyle(item.sockets, DestinySocketCategoryStyle.EnergyMeter);
  const armor2MasterworkValue =
    armor2MasterworkSockets && getSumOfArmorStats(armor2MasterworkSockets, [stat.statHash]);
  const isMasterworkedStat =
    item?.isDestiny2() && item.masterworkInfo && stat.statHash === item.masterworkInfo.statHash;
  const masterworkValue = (item?.isDestiny2() && item.masterworkInfo?.statValue) || 0;
  const masterworkDisplayValue = (isMasterworkedStat && masterworkValue) || armor2MasterworkValue;

  const moddedStatValue = item && getModdedStatValue(item, stat);

  let baseBar = value;

  if (moddedStatValue) {
    baseBar -= moddedStatValue;
  }

  if (masterworkDisplayValue) {
    baseBar -= masterworkDisplayValue;
  }

  const segments: [number, string?][] = [[baseBar]];

  if (moddedStatValue) {
    segments.push([moddedStatValue, styles.moddedStatBar]);
  }

  if (masterworkDisplayValue) {
    segments.push([masterworkDisplayValue, styles.masterworkStatBar]);
  }

  const displayValue = value;

  // Get the values that contribute to the total stat value
  let totalDetails:
    | { baseTotalValue: number; totalModsValue: number; totalMasterworkValue: number }
    | undefined;

  if (item?.isDestiny2() && stat.statHash === TOTAL_STAT_HASH) {
    totalDetails = breakDownTotalValue(value, item, armor2MasterworkSockets || []);
  }

  const optionalClasses = {
    [styles.masterworked]: isMasterworkedStat,
    [styles.modded]: Boolean(moddedStatValue),
    [styles.totalRow]: Boolean(totalDetails)
  };

  return (
    <>
      <div
        className={clsx(styles.statName, optionalClasses)}
        aria-label={stat.displayProperties.name}
        title={stat.displayProperties.description}
      >
        {stat.displayProperties.name}
      </div>

      <div className={clsx(styles.value, optionalClasses)}>
        {stat.additive && '+'}
        {displayValue}
      </div>

      {statsMs.includes(stat.statHash) && (
        <div className={clsx(optionalClasses)}>{t('Stats.Milliseconds')}</div>
      )}

      {stat.displayProperties.hasIcon && (
        <div className={styles.icon}>
          <BungieImage src={stat.displayProperties.icon} alt="" />
        </div>
      )}

      {item && isD1Stat(item, stat) && stat.qualityPercentage && stat.qualityPercentage.min !== 0 && (
        <div className={styles.quality} style={getColor(stat.qualityPercentage.min, 'color')}>
          ({stat.qualityPercentage.range})
        </div>
      )}

      {stat.statHash === 2715839340 && (
        <div className={styles.statBar}>
          <RecoilStat value={stat.value} />
        </div>
      )}

      {stat.bar && (
        <div
          className={styles.statBar}
          aria-label={stat.displayProperties.name}
          title={stat.displayProperties.description}
          aria-hidden="true"
        >
          <div className={styles.barContainer}>
            {segments.map(([val, className], index) => (
              <div
                key={index}
                className={clsx(styles.barInner, className)}
                style={{ width: percent(val / stat.maximumValue) }}
              />
            ))}
          </div>
        </div>
      )}

      {totalDetails &&
        Boolean(totalDetails.baseTotalValue) &&
        Boolean(totalDetails.totalModsValue || totalDetails.totalMasterworkValue) && (
          <div
            className={clsx(styles.totalStatDetailed, optionalClasses)}
            aria-label={stat.displayProperties.name}
            title={stat.displayProperties.description}
          >
            <span>{totalDetails.baseTotalValue}</span>
            {Boolean(totalDetails.totalModsValue) && (
              <span className={styles.totalStatModded}>{` + ${totalDetails.totalModsValue}`}</span>
            )}
            {Boolean(totalDetails.totalMasterworkValue) && (
              <span className={styles.totalStatMasterwork}>
                {` + ${totalDetails.totalMasterworkValue}`}
              </span>
            )}
          </div>
        )}
    </>
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
    <>
      <div className={styles.statName}>{t('Stats.Quality')}</div>
      <div className={styles.qualitySummary} style={getColor(item.quality.min, 'color')}>
        {t('Stats.OfMaxRoll', { range: item.quality.range })}
        <ExternalLink
          href="https://github.com/DestinyItemManager/DIM/wiki/View-how-good-the-stat-(Int-Dis-Str)-roll-on-your-armor-is"
          title={t('Stats.PercentHelp')}
        >
          <AppIcon icon={helpIcon} />
        </ExternalLink>
      </div>
    </>
  );
}

function getPlugHashesFromCategory(category: DimSocketCategory) {
  return category.sockets.map((socket) => socket?.plug?.plugItem?.hash || null).filter(Boolean);
}

/**
 * Gets all sockets that have a plug which doesn't get grouped in the Reusable socket category.
 * The reusable socket category is used in armor 1.0 for perks and stats.
 */
function getNonReuseableModSockets(item: DimItem) {
  if (!item.isDestiny2() || !item.sockets) {
    return [];
  }

  const reusableSocketCategory = item.sockets.categories.find(
    (category) => category.category.categoryStyle === DestinySocketCategoryStyle.Reusable
  );

  const reusableSocketHashes =
    (reusableSocketCategory && getPlugHashesFromCategory(reusableSocketCategory)) || [];

  return item.sockets.sockets.filter((socket) => {
    const plugItemHash = socket?.plug?.plugItem?.hash || null;
    const categoryHashes = socket?.plug?.plugItem?.itemCategoryHashes || [];
    return (
      _.intersection(categoryHashes, modItemCategoryHashes).length > 0 &&
      !reusableSocketHashes.includes(plugItemHash)
    );
  });
}

/**
 * Looks through the item sockets to find any weapon/armor mods that modify this stat.
 * Returns the total value the stat is modified by, or 0 if it is not being modified.
 */
function getModdedStatValue(item: DimItem, stat: DimStat) {
  const modSockets = getNonReuseableModSockets(item).filter((socket) =>
    Object.keys(socket?.plug?.stats || {}).includes(String(stat.statHash))
  );

  // _.sum returns 0 for empty array
  return _.sum(
    modSockets.map((socket) => (socket.plug?.stats ? socket.plug.stats[stat.statHash] : 0))
  );
}

export function isD1Stat(item: DimItem, _stat: DimStat): _stat is D1Stat {
  return item.isDestiny1();
}

/**
 * Sums up all the armor statistics from the plug in the socket.
 */
function getSumOfArmorStats(sockets: DimSocket[], armorStatHashes: number[]) {
  return _.sumBy(sockets, (socket) =>
    _.sumBy(armorStatHashes, (armorStatHash) => socket.plug?.stats?.[armorStatHash] || 0)
  );
}

function breakDownTotalValue(statValue: number, item: DimItem, masterworkSockets: DimSocket[]) {
  const modSockets = getNonReuseableModSockets(item);
  // Armor 1.0 doesn't increase stats when masterworked
  const totalModsValue = getSumOfArmorStats(modSockets, armorStats);
  const totalMasterworkValue = masterworkSockets
    ? getSumOfArmorStats(masterworkSockets, armorStats)
    : 0;
  const baseTotalValue = statValue - totalModsValue - totalMasterworkValue;

  return { baseTotalValue, totalModsValue, totalMasterworkValue };
}
