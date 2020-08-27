import React from 'react';
import { DimStat, DimItem, D1Stat, D1Item, DimSocket } from 'app/inventory/item-types';
import { statsMs, armorStats } from 'app/inventory/store/stats';
import RecoilStat from './RecoilStat';
import { percent, getColor } from 'app/shell/filters';
import clsx from 'clsx';
import BungieImage from 'app/dim-ui/BungieImage';
import _ from 'lodash';
import { t } from 'app/i18next-t';
import styles from './ItemStat.m.scss';
import ExternalLink from 'app/dim-ui/ExternalLink';
import { AppIcon, helpIcon, faExclamationTriangle } from 'app/shell/icons';
import { DestinySocketCategoryStyle } from 'bungie-api-ts/destiny2';
import { getSocketsWithStyle } from '../utils/socket-utils';
import PressTip from 'app/dim-ui/PressTip';
import { getPossiblyIncorrectStats } from 'app/utils/item-utils';
import { TOTAL_STAT_HASH, CUSTOM_TOTAL_STAT_HASH } from 'app/search/d2-known-values';
import { ItemCategoryHashes, StatHashes } from 'data/d2/generated-enums';
import { StatTotalToggle } from 'app/dim-ui/CustomStatTotal';

// used in displaying the modded segments on item stats
const modItemCategoryHashes = [
  ItemCategoryHashes.WeaponModsDamage,
  ItemCategoryHashes.ArmorModsGameplay, // armor mods (pre-2.0)
  ItemCategoryHashes.ArmorMods, // armor 2.0 mods
];

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

  const masterworkIndex =
    (item?.isDestiny2() &&
      item.masterworkInfo?.stats?.findIndex((s) => s.hash === stat.statHash)) ||
    0;

  const isMasterworkedStat =
    item?.isDestiny2() && item.masterworkInfo?.stats?.[masterworkIndex]?.hash === stat.statHash;
  const masterworkValue =
    (item?.isDestiny2() && item.masterworkInfo?.stats?.[masterworkIndex]?.value) || 0;
  const masterworkDisplayValue = (isMasterworkedStat && masterworkValue) || armor2MasterworkValue;

  const moddedStatValue = item && getModdedStatValue(item, stat);

  const baseBar = item?.bucket.inArmor ? Math.min(stat.base, stat.value) : stat.value;

  const segments: [number, string?][] = [[baseBar]];

  if (moddedStatValue && moddedStatValue > 0) {
    segments.push([moddedStatValue, styles.moddedStatBar]);
    if (masterworkDisplayValue) {
      segments.push([masterworkDisplayValue, styles.masterworkStatBar]);
    }
  } else if (moddedStatValue && moddedStatValue < 0 && masterworkDisplayValue) {
    segments.push([
      Math.max(
        0,
        Math.min(masterworkDisplayValue, stat.base + moddedStatValue + masterworkDisplayValue)
      ),
      styles.masterworkStatBar,
    ]);
  } else if (masterworkDisplayValue) {
    segments.push([masterworkDisplayValue, styles.masterworkStatBar]);
  }

  const displayValue = Math.max(0, value);

  // Get the values that contribute to the total stat value
  let totalDetails:
    | { baseTotalValue: number; totalModsValue: number; totalMasterworkValue: number }
    | undefined;

  if (item?.isDestiny2() && stat.statHash === TOTAL_STAT_HASH) {
    totalDetails = breakDownTotalValue(stat.base, item, armor2MasterworkSockets || []);
  }

  const optionalClasses = {
    [styles.masterworked]: isMasterworkedStat,
    [styles.modded]: Boolean(moddedStatValue && moddedStatValue > 0 && stat.value !== stat.base),
    [styles.negativeModded]: Boolean(
      moddedStatValue && moddedStatValue < 0 && stat.value !== stat.base
    ),
    [styles.totalRow]: Boolean(totalDetails),
  };

  const incorrectStats = (item && getPossiblyIncorrectStats(item)) || [];

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

      {item?.isDestiny2() && statsMs.includes(stat.statHash) && (
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

      {stat.statHash === StatHashes.RecoilDirection && (
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
            {Boolean(totalDetails.totalModsValue > 0) && (
              <span className={styles.totalStatModded}>{` + ${totalDetails.totalModsValue}`}</span>
            )}
            {Boolean(totalDetails.totalModsValue < 0) && (
              <span
                className={styles.totalStatNegativeModded}
              >{` - ${-totalDetails.totalModsValue}`}</span>
            )}
            {Boolean(totalDetails.totalMasterworkValue) && (
              <span className={styles.totalStatMasterwork}>
                {` + ${totalDetails.totalMasterworkValue}`}
              </span>
            )}
            {stat.baseMayBeWrong && (
              <PressTip
                elementType="span"
                tooltip={t('Stats.TotalIncorrectWarning', {
                  stats: incorrectStats.join('/'),
                })}
              >
                <AppIcon className={styles.totalStatWarn} icon={faExclamationTriangle} />
              </PressTip>
            )}
          </div>
        )}

      {item && stat.statHash === CUSTOM_TOTAL_STAT_HASH && (
        <StatTotalToggle
          forClass={item.classType}
          readOnly={true}
          className={styles.smallStatToggle}
        />
      )}
    </>
  );
}

/**
 * A single stat value, for the table view
 */
export function ItemStatValue({ stat, item }: { stat: DimStat; item?: DimItem }) {
  const masterworkIndex =
    (item?.isDestiny2() &&
      item.masterworkInfo?.stats?.findIndex((s) => s.hash === stat.statHash)) ||
    0;

  const isMasterworkedStat =
    item?.isDestiny2() && item.masterworkInfo?.stats?.[masterworkIndex]?.hash === stat.statHash;

  const moddedStatValue = item && getModdedStatValue(item, stat);

  const optionalClasses = {
    [styles.masterworked]: isMasterworkedStat,
    [styles.modded]: Boolean(moddedStatValue && moddedStatValue > 0 && stat.value !== stat.base),
    [styles.negativeModded]: Boolean(
      moddedStatValue && moddedStatValue < 0 && stat.value !== stat.base
    ),
  };

  return (
    <div className={clsx(styles.value, optionalClasses)}>
      {stat.value}
      {statsMs.includes(stat.statHash) && t('Stats.Milliseconds')}
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

/**
 * Gets all sockets that have a plug which doesn't get grouped in the Reusable socket category.
 * The reusable socket category is used in armor 1.0 for perks and stats.
 */
function getNonReuseableModSockets(item: DimItem) {
  if (!item.isDestiny2() || !item.sockets) {
    return [];
  }

  return item.sockets.allSockets.filter(
    (s) =>
      !s.isPerk &&
      _.intersection(s?.plugged?.plugDef?.itemCategoryHashes || [], modItemCategoryHashes).length >
        0
  );
}

/**
 * Looks through the item sockets to find any weapon/armor mods that modify this stat.
 * Returns the total value the stat is modified by, or 0 if it is not being modified.
 */
function getModdedStatValue(item: DimItem, stat: DimStat) {
  const modSockets = getNonReuseableModSockets(item).filter(
    (socket) => socket.plugged!.stats && String(stat.statHash) in socket.plugged!.stats
  );

  return _.sumBy(modSockets, (socket) => socket.plugged!.stats![stat.statHash]);
}

export function isD1Stat(item: DimItem, _stat: DimStat): _stat is D1Stat {
  return item.isDestiny1();
}

/**
 * Sums up all the armor statistics from the plug in the socket.
 */
function getSumOfArmorStats(sockets: DimSocket[], armorStatHashes: number[]) {
  return _.sumBy(sockets, (socket) =>
    socket.plugged?.stats
      ? _.sumBy(armorStatHashes, (armorStatHash) => socket.plugged!.stats![armorStatHash] || 0)
      : 0
  );
}

function breakDownTotalValue(baseValue: number, item: DimItem, masterworkSockets: DimSocket[]) {
  const modSockets = getNonReuseableModSockets(item);
  // Armor 1.0 doesn't increase stats when masterworked
  const totalModsValue = getSumOfArmorStats(modSockets, armorStats);
  const totalMasterworkValue = masterworkSockets
    ? getSumOfArmorStats(masterworkSockets, armorStats)
    : 0;
  const baseTotalValue = baseValue;

  return { baseTotalValue, totalModsValue, totalMasterworkValue };
}
