import Countdown from 'app/dim-ui/Countdown';
import { t } from 'app/i18next-t';
import { DimStore } from 'app/inventory/store-types';
import { percent } from 'app/shell/filters';
import {
  DestinyCharacterProgressionComponent,
  DestinyClass,
  DestinyProfileResponse,
  DestinySeasonDefinition,
  DestinySeasonPassDefinition,
} from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import brightEngrams from 'data/d2/bright-engrams.json';
import React from 'react';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions';
import BungieImage from '../dim-ui/BungieImage';
import styles from './PursuitItem.m.scss';

export default function SeasonalRank({
  store,
  defs,
  characterProgressions,
  season,
  seasonPass,
  profileInfo,
}: {
  store: DimStore;
  defs: D2ManifestDefinitions;
  characterProgressions: DestinyCharacterProgressionComponent;
  season?: DestinySeasonDefinition;
  seasonPass?: DestinySeasonPassDefinition;
  profileInfo: DestinyProfileResponse;
}) {
  if (!season) {
    return null;
  }

  const prestigeRewardHash = 1620506139; // this hash does not matter as long as it exists and is not class exclusive
  const brightEngramHash = brightEngrams[season.seasonNumber];
  const prestigeRewardLevel = 9999; // fake reward level for fake item for prestige level
  const brightEngramRewardLevel = 9998; // fake reward level for seasonal bright engram

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

  const brightEngramRewardLevelsTemp: number[] = [];

  rewardItems
    .filter((item) => item.itemHash === brightEngramHash)
    .forEach((item) => {
      brightEngramRewardLevelsTemp.push(item.rewardedAtProgressionLevel % 10);
    });

  const brightEngramRewardLevels = [...new Set(brightEngramRewardLevelsTemp)];

  if (
    // Only add the fake rewards once
    !rewardItems.filter((item) => item.rewardedAtProgressionLevel === prestigeRewardLevel).length
  ) {
    rewardItems.push(fakeReward(prestigeRewardHash, prestigeRewardLevel));
    rewardItems.push(fakeReward(brightEngramHash, brightEngramRewardLevel));
  }

  const getBrightEngram =
    prestigeMode && brightEngramRewardLevels.includes((seasonalRank + 1) % 10);
  // Get the reward item for the next progression level
  const nextRewardItems = rewardItems
    .filter((item) =>
      prestigeMode
        ? getBrightEngram
          ? item.rewardedAtProgressionLevel === brightEngramRewardLevel
          : item.rewardedAtProgressionLevel === prestigeRewardLevel
        : item.rewardedAtProgressionLevel === seasonalRank + 1
    )
    // Filter class-specific items
    .filter((item) => {
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

      return def.classType === DestinyClass.Unknown || def.classType === store.classType;
    })
    // Premium reward first to match companion
    .reverse();

  if (!rewardItems.length) {
    return null;
  }

  const hasPremiumRewards = ownCurrentSeasonPass(seasonHashes, currentSeasonHash);

  return (
    <div
      className={clsx('seasonal-rank', 'milestone-quest', {
        'has-premium-rewards': hasPremiumRewards,
      })}
    >
      <div className="milestone-icon">
        <div className="seasonal-rewards">
          {nextRewardItems.map((item) => {
            // Don't show premium reward if player doesn't own the season pass
            if (!hasPremiumRewards && item.uiDisplayStyle === 'premium') {
              return;
            }

            // Get the item info for UI display
            const itemInfo = prestigeMode
              ? getBrightEngram
                ? defs.InventoryItem.get(brightEngramHash)
                : defs.InventoryItem.get(season.artifactItemHash || 0) // make fake item out of season info for prestigeMode
              : defs.InventoryItem.get(item.itemHash);

            return (
              <div
                className={clsx('seasonal-reward-wrapper', styles.pursuit, {
                  free: item.uiDisplayStyle === 'free',
                  premium: item.uiDisplayStyle === 'premium',
                })}
                key={itemInfo.hash}
              >
                <BungieImage
                  className="perk milestone-img"
                  src={itemInfo.displayProperties.icon}
                  title={itemInfo.displayProperties.description}
                />
                {item.quantity > 1 && <div className={clsx(styles.amount)}>{item.quantity}</div>}
              </div>
            );
          })}
        </div>
        <div className="progress">
          <div className={clsx(styles.progress, 'custom-progress-bar')}>
            <div
              className={styles.progressAmount}
              style={{ width: percent(progressToNextLevel / nextLevelAt) }}
            />
          </div>
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
            <div className="season-end">
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
export function ownCurrentSeasonPass(seasonHashes: number[], currentSeasonHash?: number) {
  if (!currentSeasonHash || !seasonHashes) {
    return false;
  }
  return seasonHashes.includes(currentSeasonHash);
}

function fakeReward(hash: number, level: number) {
  return {
    acquisitionBehavior: 1,
    claimUnlockDisplayStrings: [''],
    itemClaimedUnlockHash: 0,
    itemHash: hash,
    quantity: 1,
    rewardedAtProgressionLevel: level,
    uiDisplayStyle: 'free',
  };
}
