import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import Countdown from 'app/dim-ui/Countdown';
import { useDynamicStringReplacer } from 'app/dim-ui/destiny-symbols/RichDestinyText';
import { t } from 'app/i18next-t';
import { DimStore } from 'app/inventory/store-types';
import { useD2Definitions } from 'app/manifest/selectors';
import { isClassCompatible } from 'app/utils/item-utils';
import { useCurrentSeasonInfo } from 'app/utils/seasons';
import {
  DestinyClass,
  DestinyProfileResponse,
  DestinyProgression,
  DestinyProgressionRewardItemQuantity,
  DestinySeasonDefinition,
  DestinySeasonPassDefinition,
  DestinySeasonPassReference,
} from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import brightEngramsBonus from 'data/d2/bright-engram-bonus.json';
import BungieImage, { bungieNetPath } from '../dim-ui/BungieImage';
import { ProgressBar, StackAmount } from './PursuitItem';
import * as styles from './SeasonalRank.m.scss';
import { getCharacterProgressions } from './selectors';

export default function SeasonalRank({
  store,
  profileInfo,
}: {
  store: DimStore;
  profileInfo: DestinyProfileResponse;
}) {
  const defs = useD2Definitions()!;
  const { season, seasonPass, seasonPassStartEnd } = useCurrentSeasonInfo(defs, profileInfo);
  if (!season || !seasonPass) {
    return null;
  }

  const prestigeRewardHash = season.artifactItemHash || 0;
  const prestigeRewardLevel = 9999; // fake reward level for fake item for prestige level

  // Get season details
  const seasonNameDisplay = season.displayProperties.name;

  const {
    seasonPassLevel,
    rewardItems,
    prestigeProgression,
    progressToNextLevel,
    nextLevelAt,
    prestigeMode,
    hasPremiumRewards,
  } = getSeasonPassStatus(defs, profileInfo, seasonPass, season);

  if (
    // Only add the fake rewards once
    !rewardItems.some((item) => item.rewardedAtProgressionLevel === prestigeRewardLevel)
  ) {
    rewardItems.push(fakeReward(prestigeRewardHash, prestigeRewardLevel));
  }

  const nextRewardItems = rewardItems
    .filter((item) => {
      // Get the reward items for the next progression level
      if (
        prestigeMode
          ? item.rewardedAtProgressionLevel !== prestigeRewardLevel
          : item.rewardedAtProgressionLevel !== seasonPassLevel + 1
      ) {
        return false;
      }

      // Filter class-specific items
      const def = defs.InventoryItem.get(item.itemHash);

      if (!def) {
        return false;
      }

      const plugCategoryId = def.plug?.plugCategoryIdentifier ?? '';

      if (def.itemSubType === 21) {
        // Ornament Only Filtering
        if (plugCategoryId.includes('_titan_')) {
          return DestinyClass.Titan === store.classType;
        } else if (plugCategoryId.includes('_hunter_')) {
          return DestinyClass.Hunter === store.classType;
        } else if (plugCategoryId.includes('_warlock_')) {
          return DestinyClass.Warlock === store.classType;
        }
      }

      return isClassCompatible(def.classType, store.classType);
    })
    // Premium reward first to match companion
    .reverse();

  if (!rewardItems.length) {
    return null;
  }

  const rewardPassEnd = seasonPassStartEnd?.seasonPassEndDate;

  return !prestigeMode ? (
    <div
      className={clsx('milestone-quest', {
        [styles.hasPremiumRewards]: hasPremiumRewards,
      })}
    >
      <div className="milestone-icon">
        <div className={styles.seasonalRewards}>
          {nextRewardItems.map((item) => {
            // Don't show premium reward if player doesn't own the season pass
            if (!hasPremiumRewards && item.uiDisplayStyle === 'premium') {
              return;
            }

            // Get the item info for UI display
            const itemInfo = defs.InventoryItem.get(item.itemHash);

            return (
              <div
                className={clsx(styles.seasonalRewardWrapper, {
                  [styles.free]: item.uiDisplayStyle === 'free',
                  [styles.premium]: item.uiDisplayStyle === 'premium',
                })}
                key={itemInfo.hash}
              >
                <BungieImage
                  className="perk milestone-img"
                  src={itemInfo.displayProperties.icon}
                  title={itemInfo.displayProperties.description}
                />
                {item.quantity > 1 && <StackAmount amount={item.quantity} />}
              </div>
            );
          })}
        </div>
        <div className={styles.progress}>
          <ProgressBar
            percentComplete={progressToNextLevel / nextLevelAt}
            className={styles.progressBar}
          />
          <span>{progressToNextLevel.toLocaleString()}</span>
          <wbr />/<wbr />
          <span>{nextLevelAt.toLocaleString()}</span>
        </div>
      </div>
      <div className="milestone-info">
        <span className="milestone-name">
          {t('Milestone.SeasonalRank', { rank: seasonPassLevel })}
        </span>
        <div className="milestone-description">
          {seasonNameDisplay}
          {rewardPassEnd && (
            <div className={styles.seasonEnd}>
              {t('Progress.RewardPassEndsIn')}
              <Countdown endTime={new Date(rewardPassEnd)} compact={true} />
            </div>
          )}
        </div>
      </div>
    </div>
  ) : (
    <SeasonPrestigeRank
      seasonPass={seasonPass}
      seasonPassStartEnd={seasonPassStartEnd}
      progress={prestigeProgression}
      isProgressRanks
    />
  );
}

export function SeasonPrestigeRank({
  seasonPass,
  seasonPassStartEnd,
  progress,
  isProgressRanks,
}: {
  seasonPass: DestinySeasonPassDefinition;
  seasonPassStartEnd: DestinySeasonPassReference | undefined;
  progress: DestinyProgression;
  isProgressRanks?: boolean;
}) {
  const defs = useD2Definitions()!;
  const replacer = useDynamicStringReplacer();
  const progressionDef = defs.Progression.get(progress.progressionHash);

  // We need to get the latest bright engram bonus icon
  const brightEngramBonus = defs.InventoryItem.get(
    brightEngramsBonus[brightEngramsBonus.length - 1],
  );
  const rewardPassEnd = seasonPassStartEnd?.seasonPassEndDate;
  const rewardPassSeasonName = seasonPass.displayProperties.name;
  return (
    <div
      className={clsx(styles.activityRank, { [styles.gridLayout]: isProgressRanks })}
      title={replacer(progressionDef.displayProperties.description)}
    >
      <ReputationRankIcon progress={progress} icon={brightEngramBonus.displayProperties.icon} />
      <div className={styles.seasonInfo}>
        <div className={styles.seasonName}>
          {t('Progress.RewardPassPrestigeRank', {
            rank: progress.level,
          })}
        </div>
        <div className={styles.seasonLevel}>
          <div className={styles.seassonTitle}>{rewardPassSeasonName}</div>
          <div>
            {progress.progressToNextLevel.toLocaleString()} /{' '}
            {progress.nextLevelAt.toLocaleString()}
          </div>

          {rewardPassEnd && (
            <div className={clsx(styles.seasonLevel, styles.seasonEnd)}>
              {t('Progress.RewardPassEndsIn')}
              <Countdown endTime={new Date(rewardPassEnd)} compact={true} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function ReputationRankIcon({
  progress,
  icon,
}: {
  progress: DestinyProgression;
  icon: string;
}) {
  const circumference = 2 * 22 * Math.PI;

  return (
    <div className={styles.seasonRankIcon}>
      <svg viewBox="0 0 54 54">
        <circle r="22.5" cx="27" cy="27" fillOpacity="0" stroke="#555" strokeWidth="3" />
        {progress.progressToNextLevel > 0 && (
          <circle
            r="22.5"
            cx="-27"
            cy="27"
            transform="rotate(-90)"
            className={styles.seasonRankProgress}
            strokeWidth="3"
            strokeDasharray={`${
              (circumference * progress.progressToNextLevel) / progress.nextLevelAt
            } ${circumference}`}
            stroke="cyan"
          />
        )}
        <image xlinkHref={bungieNetPath(icon)} width="36" height="36" x="9" y="9" />
      </svg>
    </div>
  );
}

export function getSeasonPassStatus(
  defs: D2ManifestDefinitions,
  profileInfo: DestinyProfileResponse,
  seasonPass: DestinySeasonPassDefinition,
  season: DestinySeasonDefinition,
  storeId?: string,
) {
  const characterProgressions = getCharacterProgressions(profileInfo, storeId)!;
  const seasonPassProgressionHash = seasonPass.rewardProgressionHash;
  const seasonProgression = characterProgressions.progressions[seasonPassProgressionHash];
  const seasonProgressionDef = defs.Progression.get(seasonPassProgressionHash);
  const baseLevels =
    seasonProgressionDef.steps.filter((step) => step.progressTotal === 100000).length + 1;

  const prestigeProgressionHash = seasonPass.prestigeProgressionHash;
  const prestigeProgression = characterProgressions.progressions[prestigeProgressionHash];
  const prestigeProgressionDef = defs.Progression.get(prestigeProgressionHash);

  // Take seasonpass level and add prestige progress adjusted to remove 500k xp levels double counting
  const seasonPassLevel = Math.min(seasonProgression.level, baseLevels) + prestigeProgression.level;
  const { rewardItems } = defs.Progression.get(seasonPassProgressionHash);

  const prestigeMode = seasonProgression.level === seasonProgression.levelCap;

  const { progressToNextLevel, nextLevelAt } = prestigeMode
    ? prestigeProgression
    : seasonProgression;

  const hasPremiumRewards = (profileInfo?.profile?.data?.seasonHashes || []).includes(season.hash);

  const weeklyProgress = prestigeMode
    ? prestigeProgression.weeklyProgress
    : seasonProgression.weeklyProgress;

  return {
    seasonPassLevel,
    rewardItems,
    progressToNextLevel,
    nextLevelAt,
    weeklyProgress,

    // The number of regular 100k xp requiring levels
    baseLevels,

    /** The player hit the end of the season pass and is now "prestiging it" to levels beyond the reward track. */
    prestigeMode,
    hasPremiumRewards,

    // Raw progression information
    seasonProgression,
    seasonProgressionDef,

    prestigeProgression,
    prestigeProgressionDef,
  };
}

function fakeReward(hash: number, level: number): DestinyProgressionRewardItemQuantity {
  return {
    acquisitionBehavior: 1,
    claimUnlockDisplayStrings: [''],
    hasConditionalVisibility: false,
    itemHash: hash,
    quantity: 1,
    rewardedAtProgressionLevel: level,
    uiDisplayStyle: 'free',
    rewardItemIndex: 0,
    socketOverrides: [],
  };
}
