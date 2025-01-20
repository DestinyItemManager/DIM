import Countdown from 'app/dim-ui/Countdown';
import { t } from 'app/i18next-t';
import { DimStore } from 'app/inventory/store-types';
import { useD2Definitions } from 'app/manifest/selectors';
import { isClassCompatible } from 'app/utils/item-utils';
import {
  DestinyCharacterProgressionComponent,
  DestinyClass,
  DestinyProfileResponse,
  DestinyProgressionRewardItemQuantity,
  DestinySeasonDefinition,
  DestinySeasonPassDefinition,
} from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import BungieImage from '../dim-ui/BungieImage';
import { ProgressBar, StackAmount } from './PursuitItem';
import styles from './SeasonalRank.m.scss';

export default function SeasonalRank({
  store,
  characterProgressions,
  season,
  seasonPass,
  profileInfo,
}: {
  store: DimStore;
  characterProgressions: DestinyCharacterProgressionComponent;
  season?: DestinySeasonDefinition;
  seasonPass?: DestinySeasonPassDefinition;
  profileInfo: DestinyProfileResponse;
}) {
  const defs = useD2Definitions()!;
  if (!season) {
    return null;
  }

  const prestigeRewardHash = season.artifactItemHash || 0;
  const prestigeRewardLevel = 9999; // fake reward level for fake item for prestige level

  // Get season details
  const seasonNameDisplay = season.displayProperties.name;
  const seasonPassProgressionHash = seasonPass?.rewardProgressionHash;
  const prestigeProgressionHash = seasonPass?.prestigeProgressionHash;

  if (!seasonPassProgressionHash || !prestigeProgressionHash) {
    return null;
  }
  const seasonEnd = season.endDate;
  const currentSeasonHash = season.hash;
  const seasonHashes = profileInfo?.profile?.data?.seasonHashes || [];

  // Get seasonal character progressions
  const seasonProgress = characterProgressions.progressions[seasonPassProgressionHash];
  const prestigeProgress = characterProgressions.progressions[prestigeProgressionHash];

  const prestigeMode = seasonProgress.level === seasonProgress.levelCap;

  const seasonalRank = prestigeMode
    ? prestigeProgress?.level + seasonProgress.levelCap
    : seasonProgress.level;
  const { progressToNextLevel, nextLevelAt } = prestigeMode ? prestigeProgress : seasonProgress;
  const { rewardItems } = defs.Progression.get(seasonPassProgressionHash);

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
          : item.rewardedAtProgressionLevel !== seasonalRank + 1
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

  const hasPremiumRewards = ownCurrentSeasonPass(seasonHashes, currentSeasonHash);

  return (
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
          <span>
            {progressToNextLevel.toLocaleString()}
            <wbr />/<wbr />
            {nextLevelAt.toLocaleString()}
          </span>
        </div>
      </div>
      <div className="milestone-info">
        <span className="milestone-name">
          {t('Milestone.SeasonalRank', { rank: seasonalRank })}
        </span>
        <div className="milestone-description">
          {seasonNameDisplay}
          {seasonEnd && (
            <div className={styles.seasonEnd}>
              {t('Milestone.SeasonEnds')}
              <Countdown endTime={new Date(seasonEnd)} compact={true} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Does the player own the current season pass?
 */
function ownCurrentSeasonPass(seasonHashes: number[], currentSeasonHash?: number) {
  if (!currentSeasonHash || !seasonHashes) {
    return false;
  }
  return seasonHashes.includes(currentSeasonHash);
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
