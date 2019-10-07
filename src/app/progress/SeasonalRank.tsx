import React from 'react';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions';
import BungieImage from '../dim-ui/BungieImage';
import {
  DestinyCharacterProgressionComponent,
  DestinySeasonDefinition,
  DestinyProfileResponse
} from 'bungie-api-ts/destiny2';
import Countdown from 'app/dim-ui/Countdown';

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
  const formatter = new Intl.NumberFormat(window.navigator.language);

  // Get season details
  const seasonNameDisplay = season && season.displayProperties.name;
  const seasonPassProgressionHash = season && season.seasonPassProgressionHash;
  const seasonEnd = season && season.endDate;
  const { seasonHashes } = profileInfo.profile.data!;
  const currentSeasonHash = season && season.hash;

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
      className={`seasonal-rank milestone-quest ${hasPremiumRewards ? 'has-premium-rewards' : ''}`}
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
              className={`seasonal-reward-wrapper ${
                item.uiDisplayStyle === 'free' ? 'free' : 'premium'
              }`}
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
        <span>
          {formatter.format(progressToNextLevel)}
          <wbr />/<wbr />
          {formatter.format(nextLevelAt)}
        </span>
      </div>
      <div className="milestone-info">
        <span className="milestone-name">Rank {seasonalRank}</span>
        <div className="milestone-description">
          {seasonNameDisplay}
          <br />
          <div className="season-end">
            <span className="season-end-title">Season ends: </span>
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
  if (!currentSeasonHash) {
    return false;
  }
  return seasonHashes.includes(currentSeasonHash);
}
