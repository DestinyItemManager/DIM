import { customStatsSelector, settingSelector } from 'app/dim-api/selectors';
import AnimatedNumber from 'app/dim-ui/AnimatedNumber';
import BungieImage from 'app/dim-ui/BungieImage';
import { CustomStatWeightsFromHash } from 'app/dim-ui/CustomStatWeights';
import ExternalLink from 'app/dim-ui/ExternalLink';
import { PressTip } from 'app/dim-ui/PressTip';
import { I18nKey, t, tl } from 'app/i18next-t';
import { D1Item, D1Stat, DimItem, DimSocket, DimStat } from 'app/inventory/item-types';
import { statsMs } from 'app/inventory/store/stats';
import { TOTAL_STAT_HASH, armorStats, statfulOrnaments } from 'app/search/d2-known-values';
import { getD1QualityColor, percent } from 'app/shell/formatters';
import { AppIcon, helpIcon, tunedStatIcon } from 'app/shell/icons';
import { userGuideUrl } from 'app/shell/links';
import { sumBy } from 'app/utils/collections';
import { compareBy, reverseComparator } from 'app/utils/comparators';
import { LookupTable } from 'app/utils/util-types';
import clsx from 'clsx';
import { ItemCategoryHashes, StatHashes } from 'data/d2/generated-enums';
import { clamp } from 'es-toolkit';
import React from 'react';
import { useSelector } from 'react-redux';
import {
  getSocketsByType,
  getWeaponComponentSockets,
  socketContainsIntrinsicPlug,
} from '../utils/socket-utils';
import * as styles from './ItemStat.m.scss';
import RecoilStat from './RecoilStat';

// used in displaying the modded segments on item stats
const modItemCategoryHashes = new Set([
  ItemCategoryHashes.WeaponModsDamage,
  ItemCategoryHashes.ArmorModsGameplay, // armor mods (pre-2.0)
  ItemCategoryHashes.ArmorMods, // armor 2.0 mods
]);

// Some stat labels are long. This lets us replace them with i18n
const statLabels: LookupTable<StatHashes, I18nKey> = {
  [StatHashes.RoundsPerMinute]: tl('Organizer.Stats.RPM'),
  [StatHashes.AirborneEffectiveness]: tl('Organizer.Stats.Airborne'),
  [StatHashes.AmmoGeneration]: tl('Organizer.Stats.AmmoGeneration'),
};

type StatSegmentType = 'base' | 'parts' | 'traits' | 'mod' | 'masterwork';
const statStyles: Record<StatSegmentType, [style: string, label: I18nKey]> = {
  base: [styles.base, tl('Organizer.Columns.BaseStats')],
  parts: [styles.parts, tl('Stats.WeaponPart')],
  traits: [styles.trait, tl('Organizer.Columns.Traits')],
  mod: [styles.mod, tl('Loadouts.Mods')],
  masterwork: [styles.masterwork, tl('Organizer.Columns.MasterworkStat')],
};
type StatSegments = [value: number, statSegmentType: StatSegmentType, modName?: string][];

/**
 * A single stat line.
 */
export default function ItemStat({
  stat,
  item,
  itemStatInfo,
}: {
  stat: DimStat;
  item?: DimItem;
  itemStatInfo?: {
    /** Stat hash the item's tuning slot affects */
    tunedStatHash?: number;
    /** Results from getArmor3StatFocus */
    statFocus?: StatHashes[];
  };
}) {
  const showQuality = useSelector(settingSelector('itemQuality'));
  const customStatsList = useSelector(customStatsSelector);
  const customStatHashes = customStatsList.map((c) => c.statHash);

  const modEffects =
    item &&
    getModEffects(item, stat.statHash).sort(reverseComparator(compareBy(([value]) => value)));
  const modEffectsTotal = modEffects ? sumBy(modEffects, ([value]) => value) : 0;

  const partEffects =
    item &&
    getWeaponComponentEffects(item, stat.statHash).sort(
      reverseComparator(compareBy(([value]) => value)),
    );
  const partEffectsTotal = partEffects ? sumBy(partEffects, ([value]) => value) : 0;

  const traitEffects =
    item &&
    getTraitEffects(item, stat.statHash).sort(reverseComparator(compareBy(([value]) => value)));
  const perkEffectsTotal = traitEffects ? sumBy(traitEffects, ([value]) => value) : 0;

  const armorMasterworkSockets = item?.sockets?.allSockets.filter((s) =>
    s.plugged?.plugDef.plug.plugCategoryIdentifier.startsWith('v460.plugs.armor.masterworks'),
  );
  const armorMasterworkValue =
    armorMasterworkSockets && getTotalPlugEffects(armorMasterworkSockets, [stat.statHash]);

  const masterworkValue =
    item?.masterworkInfo?.stats?.find((s) => s.hash === stat.statHash)?.value ?? 0;
  // This bool controls the stat name being gold
  const isMasterworkedStat = !item?.bucket.inArmor && masterworkValue !== 0;
  const masterworkDisplayValue = masterworkValue || armorMasterworkValue;
  let masterworkDisplayWidth = masterworkDisplayValue || 0;

  // baseBar here is the leftmost segment of the stat bar.
  // For armor, this is the "roll," the sum of its invisible stat plugs.
  // For weapons, this is the default base stat in its item definition, before barrels/mags/etc.
  const baseBar = item?.bucket.inArmor
    ? // if it's armor, the base bar length should be
      // the shortest of base or resulting value, but not below 0
      Math.max(Math.min(stat.base, stat.value), 0)
    : // otherwise, for weapons, we just subtract masterwork and
      // consider the "base" to include selected perks but not mods
      stat.value - masterworkValue - modEffectsTotal - partEffectsTotal - perkEffectsTotal;

  const segments: StatSegments = [[baseBar, 'base']];

  for (const [effectAmount, modName] of partEffects ?? []) {
    segments.push([effectAmount, 'parts', modName]);
  }
  for (const [effectAmount, modName] of traitEffects ?? []) {
    segments.push([effectAmount, 'traits', modName]);
  }

  for (const [effectAmount, modName] of modEffects ?? []) {
    segments.push([effectAmount, 'mod', modName]);
  }

  if (masterworkDisplayWidth) {
    // Account for a masterwork being completely counteracted by a mod penalty.
    // A MW segment cannot be longer than the bar's total.
    // ie: a +6 base, a +2mw, and a -10 mod, results in 0. MW segment width is 0.
    if (modEffectsTotal < 0) {
      masterworkDisplayWidth = clamp(masterworkDisplayWidth, 0, stat.value);
    }
    segments.push([masterworkDisplayWidth, 'masterwork']);
  }

  // Get the values that contribute to the total stat value
  const totalDetails =
    item &&
    stat.statHash === TOTAL_STAT_HASH &&
    breakDownTotalValue(stat.base, item, armorMasterworkSockets || []);

  const modSign =
    (stat.value !== stat.base ? modEffectsTotal : 0) * (stat.smallerIsBetter ? -1 : 1);

  const optionalClasses = {
    [styles.masterworked]: isMasterworkedStat,
    [styles.mod]: modSign > 0,
    [styles.negativeModded]: modSign < 0,
    [styles.totalRow]: Boolean(totalDetails),
    [styles.customTotal]: customStatHashes.includes(stat.statHash),
    [styles.archetypeStat]:
      itemStatInfo?.statFocus?.[0] === stat.statHash ||
      itemStatInfo?.statFocus?.[1] === stat.statHash,
  };

  return (
    <>
      <div
        className={clsx(styles.statName, optionalClasses)}
        aria-label={stat.displayProperties.name}
        title={stat.displayProperties.description}
      >
        {stat.statHash === itemStatInfo?.tunedStatHash && (
          <AppIcon icon={tunedStatIcon} className={styles.tunableSymbol} />
        )}{' '}
        {stat.statHash in statLabels
          ? t(statLabels[stat.statHash as StatHashes]!)
          : stat.displayProperties.name}
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
          <BungieImage className="stat-icon" src={stat.displayProperties.icon} alt="" />
        </div>
      )}

      {showQuality &&
        item &&
        isD1Stat(item, stat) &&
        stat.qualityPercentage &&
        stat.qualityPercentage.min !== 0 && (
          <div
            className={styles.quality}
            style={getD1QualityColor(stat.qualityPercentage.min, 'color')}
          >
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
        Boolean(totalDetails.totalModsValue || totalDetails.totalMasterworkValue) && (
          <StatTotal totalDetails={totalDetails} optionalClasses={optionalClasses} stat={stat} />
        )}

      {item && customStatHashes.includes(stat.statHash) && (
        <CustomStatWeightsFromHash
          className={clsx(styles.smallStatToggle, styles.nonDimmedStatIcons)}
          customStatHash={stat.statHash}
        />
      )}
    </>
  );
}

function StatBar({ segments, stat }: { segments: StatSegments; stat: DimStat }) {
  // Make sure the combined "filled"-colored segments never exceed this.
  let remainingFilled = stat.value;
  // Make sure the red bar section never exceeds the blank space,
  // which would increase the total stat bar width.
  let remainingEmpty = Math.max(stat.maximumValue - stat.value, 0);
  return (
    <div className={styles.statBar} aria-label={stat.displayProperties.name} aria-hidden="true">
      <PressTip
        placement="top-start"
        className={styles.barContainer}
        tooltip={<StatBarTooltip segments={segments} stat={stat} />}
      >
        {segments
          // Process base stats last, letting them be the most likely to hit cap and lose display length
          .toSorted(([, statType]) => (statType === 'base' ? 1 : 0))
          .map(([val, statType], index) => {
            let segmentLength = Math.abs(val);
            if (val < 0) {
              segmentLength = Math.min(segmentLength, remainingEmpty);
              remainingEmpty -= segmentLength;
            } else {
              segmentLength = Math.min(segmentLength, remainingFilled);
              remainingFilled -= segmentLength;
            }
            return (
              <div
                key={index}
                className={clsx(
                  styles.statBarSegment,
                  val < 0 && statType !== 'masterwork' ? styles.negative : statStyles[statType][0],
                )}
                style={{ width: percent(segmentLength / stat.maximumValue) }}
              />
            );
          })}
      </PressTip>
    </div>
  );
}

function StatBarTooltip({ segments, stat }: { segments: StatSegments; stat: DimStat }) {
  const showMath = !(segments.length === 1 && segments[0][1] === 'base');
  return (
    <>
      <div className={styles.statBarTooltip}>
        {showMath &&
          segments.map(([val, statType, description], index) => {
            const [typeClassName, i18nLabel] = statStyles[statType];
            const className = clsx(typeClassName, { [styles.negative]: val < 0 });
            return (
              <React.Fragment key={index}>
                <span className={className}>
                  {index > 0 && val >= 0 && '+'}
                  {val}
                </span>
                <span className={className}>{description || t(i18nLabel)}</span>
              </React.Fragment>
            );
          })}
        <span className={clsx({ [styles.tooltipTotalRow]: showMath }, styles.tooltipNetStat)}>
          <span>{stat.value}</span>
          <span>{stat.displayProperties.name}</span>
        </span>
      </div>
    </>
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
 * A special stat row for D1 items that have item quality calculations
 */
export function D1QualitySummaryStat({ item }: { item: D1Item }) {
  if (!item.quality) {
    return null;
  }
  return (
    <>
      <div className={styles.statName}>{t('Stats.Quality')}</div>
      <div className={styles.qualitySummary} style={getD1QualityColor(item.quality.min, 'color')}>
        {t('Stats.OfMaxRoll', { range: item.quality.range })}
        <ExternalLink
          href={userGuideUrl('View-how-good-the-stat-(Int-Dis-Str)-roll-on-your-armor-is')}
          title={t('Stats.PercentHelp')}
        >
          <AppIcon icon={helpIcon} />
        </ExternalLink>
      </div>
    </>
  );
}

/**
 * Gets sockets that are considered "mods", like "Mobility Mod" in armor,
 * or "Adept Range" on weapons. These are marked blue on stat bars.
 */
function getNonReusableModSockets(item: DimItem) {
  if (!item.sockets) {
    return [];
  }

  return item.sockets.allSockets.filter(
    (s) =>
      s.plugged &&
      !s.isPerk && // excludes armor 1.0 perks and stats?
      !socketContainsIntrinsicPlug(s) &&
      !s.plugged.plugDef.plug.plugCategoryIdentifier.includes('masterwork') &&
      (s.plugged.plugDef.itemCategoryHashes?.some((h) => modItemCategoryHashes.has(h)) ||
        statfulOrnaments.includes(s.plugged.plugDef.hash) ||
        // Tuning mods don't have the ArmorMods item category hash
        s.plugged.plugDef.plug.plugCategoryIdentifier.includes('tuning.mods') ||
        // Might be v400.weapon.mod_guns or v400.weapon.mod_damage. Covers new "Enhanced [statname]" on T5 weapons.
        s.plugged.plugDef.plug.plugCategoryIdentifier.includes('weapon.mod_')),
  );
}

/**
 * Looks through the item sockets to find any weapon/armor mods that modify this stat.
 * Returns the value the stat is modified by, or 0 if it is not being modified.
 */
function getModEffects(item: DimItem, statHash: number) {
  const modSockets = getNonReusableModSockets(item);
  return getPlugEffects(modSockets, [statHash]);
}

/**
 * Looks through the item sockets to find any weapon components, like barrels, mags, etc. modify this stat.
 * Returns the value the stat is modified by, or 0 if it is not being modified.
 */
function getWeaponComponentEffects(item: DimItem, statHash: number) {
  const modSockets = getWeaponComponentSockets(item);
  return getPlugEffects(modSockets, [statHash]);
}

/**
 * Looks through the item sockets to find any perks (think Outlaw/Rampage) that modify this stat.
 * Returns the value the stat is modified by, or 0 if it is not being modified.
 */
function getTraitEffects(item: DimItem, statHash: number) {
  const perkSockets = getSocketsByType(item, 'traits');
  return getPlugEffects(perkSockets, [statHash]);
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
function getTotalPlugEffects(sockets: DimSocket[], armorStatHashes: number[]) {
  return sumBy(getPlugEffects(sockets, armorStatHashes), ([s]) => s);
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
function getPlugEffects(sockets: DimSocket[], statHashes: number[]) {
  const modEffects: [value: number, name: string][] = [];

  for (const socket of sockets) {
    if (!socket.plugged?.enabled || !socket.plugged.stats || socketContainsIntrinsicPlug(socket)) {
      continue;
    }

    for (const [statHash_, modificationAmount] of Object.entries(socket.plugged.stats)) {
      const statHash = Number(statHash_);
      if (!statHashes.includes(statHash)) {
        continue;
      }

      modEffects.push([modificationAmount.value, socket.plugged.plugDef.displayProperties.name]);
    }
  }
  return modEffects;
}

function breakDownTotalValue(
  baseTotalValue: number,
  item: DimItem,
  masterworkSockets: DimSocket[],
) {
  const modSockets = getNonReusableModSockets(item);

  // Armor 1.0 doesn't increase stats when masterworked
  const totalModsValue = getTotalPlugEffects(modSockets, armorStats);
  const totalMasterworkValue = masterworkSockets
    ? getTotalPlugEffects(masterworkSockets, armorStats)
    : 0;
  return { baseTotalValue, totalModsValue, totalMasterworkValue };
}
