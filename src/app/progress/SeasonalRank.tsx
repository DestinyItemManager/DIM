import React from 'react';
import idx from 'idx';
import classNames from 'classnames';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions';
import BungieImage from '../dim-ui/BungieImage';
import {
  DestinyCharacterProgressionComponent,
  DestinySeasonDefinition,
  DestinyProfileResponse
} from 'bungie-api-ts/destiny2';
import Countdown from 'app/dim-ui/Countdown';
import { numberFormatter } from 'app/utils/util';
import { settings } from 'app/settings/settings';
import { t } from 'app/i18next-t';
import styles from './PursuitItem.m.scss';
import { percent } from 'app/shell/filters';

export default function SeasonalRank({
  defs,
  characterProgressions,
  season,
  profileInfo
}: {
  defs: D2ManifestDefinitions;
  characterProgressions: DestinyCharacterProgressionComponent;
  season: DestinySeasonDefinition | undefined;
  profileInfo: DestinyProfileResponse;
}) {
  const formatter = numberFormatter(settings.language);

  if (!season) {
    return null;
  }

  // Get season details
  const seasonNameDisplay = season.displayProperties.name;
  const seasonPassProgressionHash = season.seasonPassProgressionHash;
  const seasonEnd = season.endDate;
  const currentSeasonHash = season.hash;
  const seasonHashes = idx(profileInfo, (p) => p.profile.data.seasonHashes) || [];

  // Get seasonal character progressions
  const seasonProgress = characterProgressions.progressions[seasonPassProgressionHash!];
  const { level: seasonalRank, progressToNextLevel, nextLevelAt } = seasonProgress;
  const { rewardItems } = defs.Progression.get(seasonPassProgressionHash!);

  // Get the reward item for the next progression level
  const nextRewardItems = rewardItems
    .filter((item) => item.rewardedAtProgressionLevel === seasonalRank + 1)
    // Premium reward first to match companion
    .reverse();

  const hasPremiumRewards = ownCurrentSeasonPass(seasonHashes, currentSeasonHash);

  return (
    <div
      className={classNames('seasonal-rank', 'milestone-quest', {
        'has-premium-rewards': hasPremiumRewards
      })}
    >
      <div className="milestone-icon">
        {nextRewardItems.map((item) => {
          // Don't show premium reward if player doesn't own the season pass
          if (!hasPremiumRewards && item.uiDisplayStyle === 'premium') {
            return;
          }

          // Get the item info for UI display
          const itemInfo = defs.InventoryItem.get(item.itemHash);

          return (
            <div
              className={classNames('seasonal-reward-wrapper', {
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
              {item.quantity && item.quantity > 1 && (
                <div className="seasonal-reward-quantity">{item.quantity}</div>
              )}
            </div>
          );
        })}
        <div className="progress">
          <div className={classNames(styles.progress, 'custom-progress-bar')}>
            <div
              className={styles.progressAmount}
              style={{ width: percent(progressToNextLevel / nextLevelAt) }}
            />
          </div>
          <span>
            {formatter.format(progressToNextLevel)}
            <wbr />/<wbr />
            {formatter.format(nextLevelAt)}
          </span>
        </div>
      </div>
      <div className="milestone-info">
        <span className="milestone-name">
          {t('Milestone.SeasonalRank')} {seasonalRank}
        </span>
        <div className="milestone-description">
          {seasonNameDisplay}
          <br />
          <div className="season-end">
            <span className="season-end-title">{t('Milestone.SeasonEnds')}</span>
            <Countdown endTime={new Date(seasonEnd!)} compact={true} />
          </div>
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
