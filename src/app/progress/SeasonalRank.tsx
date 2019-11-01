import React from 'react';
import idx from 'idx';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions';
import BungieImage from '../dim-ui/BungieImage';
import {
  DestinyCharacterProgressionComponent,
  DestinySeasonDefinition,
  DestinyProfileResponse,
  DestinyClass
} from 'bungie-api-ts/destiny2';
import Countdown from 'app/dim-ui/Countdown';
import { t } from 'app/i18next-t';
import styles from './PursuitItem.m.scss';
import { percent } from 'app/shell/filters';
import clsx from 'clsx';
import { DimStore } from 'app/inventory/store-types';

export default function SeasonalRank({
  store,
  defs,
  characterProgressions,
  season,
  profileInfo
}: {
  store: DimStore;
  defs: D2ManifestDefinitions;
  characterProgressions: DestinyCharacterProgressionComponent;
  season: DestinySeasonDefinition | undefined;
  profileInfo: DestinyProfileResponse;
}) {
  if (!season) {
    return null;
  }

  // Get season details
  const seasonNameDisplay = season.displayProperties.name;
  const seasonPassProgressionHash = season.seasonPassProgressionHash;
  if (!seasonPassProgressionHash) {
    return null;
  }
  const seasonEnd = season.endDate;
  const currentSeasonHash = season.hash;
  const seasonHashes = idx(profileInfo, (p) => p.profile.data.seasonHashes) || [];

  // Get seasonal character progressions
  const seasonProgress = characterProgressions.progressions[seasonPassProgressionHash];
  const { level: seasonalRank, progressToNextLevel, nextLevelAt } = seasonProgress;
  const { rewardItems } = defs.Progression.get(seasonPassProgressionHash);

  // Get the reward item for the next progression level
  const nextRewardItems = rewardItems
    .filter((item) => item.rewardedAtProgressionLevel === seasonalRank + 1)
    // Filter class-specific items
    .filter((item) => {
      const def = defs.InventoryItem.get(item.itemHash);
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
        'has-premium-rewards': hasPremiumRewards
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
            const itemInfo = defs.InventoryItem.get(item.itemHash);

            return (
              <div
                className={clsx('seasonal-reward-wrapper', styles.pursuit, {
                  free: item.uiDisplayStyle === 'free',
                  premium: item.uiDisplayStyle === 'premium'
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
