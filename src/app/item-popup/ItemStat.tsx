import AnimatedNumber from 'app/dim-ui/AnimatedNumber';
import BungieImage from 'app/dim-ui/BungieImage';
import { StatTotalToggle } from 'app/dim-ui/CustomStatTotal';
import ExternalLink from 'app/dim-ui/ExternalLink';
import { PressTip } from 'app/dim-ui/PressTip';
import { t, tl } from 'app/i18next-t';
import { D1Item, D1Stat, DimItem, DimSocket, DimStat } from 'app/inventory/item-types';
import { statsMs } from 'app/inventory/store/stats';
import { armorStats, CUSTOM_TOTAL_STAT_HASH, TOTAL_STAT_HASH } from 'app/search/d2-known-values';
import { getColor, percent } from 'app/shell/formatters';
import { AppIcon, helpIcon } from 'app/shell/icons';
import { isPlugStatActive } from 'app/utils/item-utils';
import { DestinySocketCategoryStyle } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import { ItemCategoryHashes, StatHashes } from 'data/d2/generated-enums';
import _ from 'lodash';
import { getSocketsWithStyle, socketContainsIntrinsicPlug } from '../utils/socket-utils';
import styles from './ItemStat.m.scss';
import RecoilStat from './RecoilStat';

// used in displaying the modded segments on item stats
const modItemCategoryHashes = [
  ItemCategoryHashes.WeaponModsDamage,
  ItemCategoryHashes.ArmorModsGameplay, // armor mods (pre-2.0)
  ItemCategoryHashes.ArmorMods, // armor 2.0 mods
];

// Some stat labels are long. This lets us replace them with i18n
const statLabels: Record<number, string | undefined> = {
  [StatHashes.RoundsPerMinute]: tl('Organizer.Stats.RPM'),
  [StatHashes.AirborneEffectiveness]: tl('Organizer.Stats.Airborne'),
};

/**
 * A single stat line.
 */
export default function ItemStat({ stat, item }: { stat: DimStat; item?: DimItem }) {
  const armor2MasterworkSockets =
    item?.sockets && getSocketsWithStyle(item.sockets, DestinySocketCategoryStyle.EnergyMeter);
  const armor2MasterworkValue =
    armor2MasterworkSockets && getTotalPlugEffects(armor2MasterworkSockets, [stat.statHash], item);

  const masterworkValue =
    item?.masterworkInfo?.stats?.find((s) => s.hash === stat.statHash)?.value ?? 0;
  const isMasterworkedStat = masterworkValue !== 0;
  const masterworkDisplayValue = masterworkValue ?? armor2MasterworkValue;

  const modEffects = item && _.sortBy(getModEffects(item, stat.statHash), ([n]) => -n);
  const modEffectsTotal = modEffects ? _.sumBy(modEffects, ([n]) => n) : 0;

  const baseBar = item?.bucket.inArmor
    ? // if it's armor, the base bar length should be
      // the shortest of base or resulting value, but not below 0
      Math.max(Math.min(stat.base, stat.value), 0)
    : // otherwise, for weapons, we just subtract masterwork and
      // consider the "base" to include selected perks but not mods
      stat.value - masterworkValue - modEffectsTotal;

  const segments: [amount: number, classname?: string, modName?: string][] = [[baseBar]];

  if (modEffects && modEffectsTotal > 0) {
    for (const [effectAmount, modName] of modEffects) {
      segments.push([effectAmount, styles.moddedStatBar, modName]);
    }

    if (masterworkDisplayValue) {
      segments.push([masterworkDisplayValue, styles.masterworkStatBar]);
    }
  } else if (modEffectsTotal < 0 && masterworkDisplayValue) {
    segments.push([_.clamp(masterworkDisplayValue, 0, stat.value), styles.masterworkStatBar]);
  } else if (masterworkDisplayValue) {
    segments.push([masterworkDisplayValue, styles.masterworkStatBar]);
  }

  // Get the values that contribute to the total stat value
  const totalDetails =
    item &&
    stat.statHash === TOTAL_STAT_HASH &&
    breakDownTotalValue(stat.base, item, armor2MasterworkSockets || []);

  const optionalClasses = {
    [styles.masterworked]: isMasterworkedStat,
    [styles.modded]: Boolean(modEffectsTotal && modEffectsTotal > 0 && stat.value !== stat.base),
    [styles.negativeModded]: Boolean(modEffectsTotal < 0 && stat.value !== stat.base),
    [styles.totalRow]: Boolean(totalDetails),
  };

  return (
    <>
      <div
        className={clsx(styles.statName, optionalClasses)}
        aria-label={stat.displayProperties.name}
        title={stat.displayProperties.description}
      >
        {stat.statHash in statLabels ? t(statLabels[stat.statHash]!) : stat.displayProperties.name}
      </div>

      <div className={clsx(styles.value, optionalClasses)}>
        {stat.additive && stat.value >= 0 && '+'}
        <AnimatedNumber value={stat.value} />
      </div>

      {item?.destinyVersion === 2 && statsMs.includes(stat.statHash) && (
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

      {stat.bar && <StatBar stat={stat} segments={segments} />}

      {totalDetails &&
        Boolean(totalDetails.baseTotalValue) &&
        Boolean(totalDetails.totalModsValue || totalDetails.totalMasterworkValue) && (
          <StatTotal totalDetails={totalDetails} optionalClasses={optionalClasses} stat={stat} />
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

function StatBar({ segments, stat }: { segments: [number, string?, string?][]; stat: DimStat }) {
  return (
    <div className={styles.statBar} aria-label={stat.displayProperties.name} aria-hidden="true">
      <div className={styles.barContainer}>
        {segments.map(([val, className, description], index) => (
          <PressTip
            key={index}
            minimal
            tooltip={[description, val].filter(Boolean).join(': ') || undefined}
            className={clsx(styles.barInner, className)}
            style={{ width: percent(val / stat.maximumValue) }}
          />
        ))}
      </div>
    </div>
  );
}

function StatTotal({
  totalDetails,
  optionalClasses,
  stat,
}: {
  totalDetails: {
    baseTotalValue: number;
    totalModsValue: number;
    totalMasterworkValue: number;
  };
  optionalClasses: NodeJS.Dict<boolean>;
  stat: DimStat;
}) {
  return (
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
    </div>
  );
}

/**
 * A single stat value, for the table view
 */
export function ItemStatValue({
  stat,
  item,
  baseStat,
}: {
  stat: DimStat;
  item: DimItem;
  /** Display base stat value instead of modded/masterworked value */
  baseStat?: boolean;
}) {
  const masterworkIndex =
    item.masterworkInfo?.stats?.findIndex((s) => s.hash === stat.statHash) || 0;

  const isMasterworkedStat =
    !baseStat && item.masterworkInfo?.stats?.[masterworkIndex]?.hash === stat.statHash;

  const moddedStatValue = !baseStat && getTotalModEffects(item, stat.statHash);

  const value = (baseStat ? stat.base : stat.value) ?? 0;

  const optionalClasses = {
    [styles.masterworked]: isMasterworkedStat,
    [styles.modded]: Boolean(moddedStatValue && moddedStatValue > 0 && stat.value !== stat.base),
    [styles.negativeModded]: Boolean(
      moddedStatValue && moddedStatValue < 0 && stat.value !== stat.base
    ),
  };

  return (
    <div className={clsx(styles.value, optionalClasses)}>
      <AnimatedNumber value={value} />
      {statsMs.includes(stat.statHash) && t('Stats.Milliseconds')}
      {stat.statHash === StatHashes.RecoilDirection && <RecoilStat value={value} />}
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
  if (!item.sockets) {
    return [];
  }

  return item.sockets.allSockets.filter(
    (s) =>
      !s.isPerk &&
      !socketContainsIntrinsicPlug(s) &&
      !s.plugged?.plugDef.plug.plugCategoryIdentifier.includes('masterwork') &&
      _.intersection(s.plugged?.plugDef.itemCategoryHashes || [], modItemCategoryHashes).length > 0
  );
}

/**
 * Looks through the item sockets to find any weapon/armor mods that modify this stat.
 * Returns the total value the stat is modified by, or 0 if it is not being modified.
 */
function getTotalModEffects(item: DimItem, statHash: number) {
  return _.sumBy(getModEffects(item, statHash), ([s]) => s);
}
/**
 * Looks through the item sockets to find any weapon/armor mods that modify this stat.
 * Returns the total value the stat is modified by, or 0 if it is not being modified.
 */
function getModEffects(item: DimItem, statHash: number) {
  const modSockets = getNonReuseableModSockets(item);
  return getPlugEffects(modSockets, [statHash], item);
}

export function isD1Stat(item: DimItem, _stat: DimStat): _stat is D1Stat {
  return item.destinyVersion === 1;
}

/**
 * check all sockets for plug effects upon specified statHashes, and total them
 *
 * includes a check for conditionally active stats.
 * passing the item parameter will make this more accurate
 */
function getTotalPlugEffects(sockets: DimSocket[], armorStatHashes: number[], item: DimItem) {
  return _.sumBy(getPlugEffects(sockets, armorStatHashes, item), ([s]) => s);
}

/**
 * check all sockets for plug effects upon specified statHashes
 *
 * includes a check for conditionally active stats.
 * passing the item parameter will make this more accurate
 *
 * returns a list of tuples of
 * [ the mod's name, its numeric effect upon selected stats ]
 */
function getPlugEffects(sockets: DimSocket[], statHashes: number[], item: DimItem) {
  const modEffects: [number, string][] = [];

  for (const socket of sockets) {
    if (!socket.plugged?.enabled || !socket.plugged.stats || socketContainsIntrinsicPlug(socket)) {
      continue;
    }

    for (const [statHash_, modificationAmount] of Object.entries(socket.plugged.stats)) {
      const statHash = Number(statHash_);
      if (!statHashes.includes(statHash)) {
        continue;
      }

      const isConditionallyActive = Boolean(
        socket.plugged.plugDef.investmentStats.find((s) => s.statTypeHash === statHash)
          ?.isConditionallyActive
      );

      const considerActive = isPlugStatActive(
        item,
        socket.plugged.plugDef,
        statHash,
        isConditionallyActive
      );
      if (considerActive) {
        modEffects.push([modificationAmount, socket.plugged.plugDef.displayProperties.name]);
      }
    }
  }
  return modEffects;
}

function breakDownTotalValue(
  baseTotalValue: number,
  item: DimItem,
  masterworkSockets: DimSocket[]
) {
  const modSockets = getNonReuseableModSockets(item);

  // Armor 1.0 doesn't increase stats when masterworked
  const totalModsValue = getTotalPlugEffects(modSockets, armorStats, item);
  const totalMasterworkValue = masterworkSockets
    ? getTotalPlugEffects(masterworkSockets, armorStats, item)
    : 0;
  return { baseTotalValue, totalModsValue, totalMasterworkValue };
}
