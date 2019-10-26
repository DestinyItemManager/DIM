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
import idx from 'idx';
import _ from 'lodash';
import { t } from 'app/i18next-t';
import styles from './ItemStat.m.scss';
import ExternalLink from 'app/dim-ui/ExternalLink';
import { AppIcon, helpIcon } from 'app/shell/icons';
import { DestinySocketCategoryStyle } from 'bungie-api-ts/destiny2';
import { D2Item } from '../inventory/item-types';

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

  // Get the values that contribute to the total stat value
  let totalDetails:
    | { baseTotalValue: number; totalModsValue: number; totalMasterworkValue: number }
    | undefined;

  if (item.isDestiny2() && stat.statHash === TOTAL_STAT_HASH) {
    totalDetails = breakDownTotalValue(value, item);
  }

  return (
    <div
      role="row"
      aria-label={stat.displayProperties.name}
      className={clsx(styles.row, {
        [styles.masterworked]: isMasterworkedStat,
        [styles.modded]: isModdedStat
      })}
      title={stat.displayProperties.description}
    >
      <div role="cell" className={styles.statName}>
        {stat.displayProperties.name}
      </div>

      <div role="cell" className={styles.value}>
        {stat.additive && '+'}
        {displayValue}
      </div>

      {statsMs.includes(stat.statHash) && <div>{t('Stats.Milliseconds')}</div>}

      {stat.displayProperties.hasIcon && (
        <div className={styles.icon}>
          <BungieImage src={stat.displayProperties.icon} />
        </div>
      )}

      {isD1Stat(item, stat) && stat.qualityPercentage && stat.qualityPercentage.min > 0 && (
        <div className={styles.quality} style={getColor(stat.qualityPercentage.min, 'color')}>
          ({stat.qualityPercentage.range})
        </div>
      )}

      {stat.statHash === 2715839340 && (
        <div className={styles.statBar}>
          <RecoilStat stat={stat} />
        </div>
      )}

      {stat.bar && (
        <div className={styles.statBar}>
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

      {totalDetails && Boolean(totalDetails.totalModsValue || totalDetails.totalMasterworkValue) && (
        <div className={styles.totalStatDetailed}>
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
    </div>
  );
}

function getPlugHashesFromCategory(category: DimSocketCategory) {
  return category.sockets
    .map((socket) => {
      return idx(socket, (socket) => socket.plug.plugItem.hash) || null;
    })
    .filter(Boolean);
}

/**
 * Gets all sockets that have a plug which doesn't get grouped in the Reusable socket category.
 * The reusable socket category is used in armor 1.0 for perks and stats.
 */
function getNonReuseableModSockets(item: DimItem) {
  if (!item.isDestiny2() || !item.sockets) {
    return [];
  }

  const reusableSocketCategory = item.sockets.categories.find((category) => {
    return category.category.categoryStyle === DestinySocketCategoryStyle.Reusable;
  });

  const reusableSocketHashes =
    (reusableSocketCategory && getPlugHashesFromCategory(reusableSocketCategory)) || [];

  return item.sockets.sockets.filter((socket) => {
    const plugItemHash = idx(socket, (socket) => socket.plug.plugItem.hash) || null;
    const categoryHashes = idx(socket, (socket) => socket.plug.plugItem.itemCategoryHashes) || [];
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
  const modSockets = getNonReuseableModSockets(item).filter((socket) => {
    return Object.keys(idx(socket, (socket) => socket.plug.stats) || {}).includes(
      String(stat.statHash)
    );
  });

  // _.sum returns 0 for empty array
  return _.sum(
    modSockets.map((socket) =>
      socket.plug && socket.plug.stats ? socket.plug.stats[stat.statHash] : 0
    )
  );
}

export function isD1Stat(item: DimItem, _stat: DimStat): _stat is D1Stat {
  return item.isDestiny1();
}

/**
 * Finds the sockets that have plugs which are grouped under the energy meter category.
 * The energy category is where the masterwork plug lives in armor 2.0.
 */
function getArmor2MasterworkSockets(item: D2Item) {
  if (!item.sockets) {
    return [];
  }

  const masterworkSocketCategory = item.sockets.categories.find((category) => {
    return category.category.categoryStyle === DestinySocketCategoryStyle.EnergyMeter;
  });
  const masterworkSocketHashes =
    (masterworkSocketCategory && getPlugHashesFromCategory(masterworkSocketCategory)) || [];

  return item.sockets.sockets.filter((socket) => {
    const plugHash = idx(socket, (socket) => socket.plug.plugItem.hash) || null;
    return masterworkSocketHashes.includes(plugHash);
  });
}

/**
 * Sums up all the armor statistics from the plug in the socket.
 */
function getSumOfArmorStats(sockets: DimSocket[]) {
  return _.sumBy(sockets, (socket) => {
    return _.sumBy(armorStats, (armorStatHash) => {
      return (socket.plug && socket.plug.stats && socket.plug.stats[armorStatHash]) || 0;
    });
  });
}

function breakDownTotalValue(statValue: number, item: DimItem) {
  const modSockets = getNonReuseableModSockets(item);
  // Armor 1.0 doesn't increase stats when masterworked
  const masterworkSockets = item.isDestiny2() ? getArmor2MasterworkSockets(item) : null;
  const totalModsValue = getSumOfArmorStats(modSockets);
  const totalMasterworkValue = masterworkSockets ? getSumOfArmorStats(masterworkSockets) : 0;
  const baseTotalValue = statValue - totalModsValue - totalMasterworkValue;

  return { baseTotalValue, totalModsValue, totalMasterworkValue };
}
