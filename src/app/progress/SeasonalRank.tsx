import React from 'react';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions';
import BungieImage from '../dim-ui/BungieImage';
import {
  DestinyCharacterProgressionComponent,
  DestinySeasonDefinition
} from 'bungie-api-ts/destiny2';
import Countdown from 'app/dim-ui/Countdown';

export default function SeasonalRank({
  defs,
  characterProgressions,
  season
}: {
  defs: D2ManifestDefinitions;
  characterProgressions: DestinyCharacterProgressionComponent;
  season: DestinySeasonDefinition | undefined;
}) {
  const formatter = new Intl.NumberFormat(window.navigator.language);

  // Get season details
  const seasonNameDisplay = season && season.displayProperties.name;
  const seasonPassProgressionHash = season && season.seasonPassProgressionHash;
  const seasonEnd = season && season.endDate;

  // Get seasonal character progressions
  const seasonProgress = characterProgressions.progressions[seasonPassProgressionHash!];
  const { level: seasonalRank, progressToNextLevel, nextLevelAt } = seasonProgress;
  const { rewardItems } = defs.Progression.get(seasonPassProgressionHash!);

  // Get the reward item for the next progression level
  const nextRewardItems = rewardItems
    .filter((item) => item.rewardedAtProgressionLevel === seasonalRank + 1)
    .reverse();

  const hasPremiumRewards = nextRewardItems.find((item) => item.uiDisplayStyle === 'premium');

  return (
    <div
      className={`seasonal-rank milestone-quest ${hasPremiumRewards ? 'has-premium-rewards' : ''}`}
    >
      <div className="milestone-icon">
        {nextRewardItems.map((item) => {
          // Get the item info for UI display
          const itemInfo = defs.InventoryItem.get(item.itemHash);

          return (
            <div
              className={`milestone-icon-overlay ${
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
                <div className="overlay-amount">{item.quantity}</div>
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
