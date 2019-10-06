import React from 'react';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions';
import BungieImage from '../dim-ui/BungieImage';
import {
  DestinyCharacterProgressionComponent,
  DestinySeasonDefinition
} from 'bungie-api-ts/destiny2';

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

  // Get seasonal character progressions
  const seasonProgress = characterProgressions.progressions[seasonPassProgressionHash!];
  const { level: seasonalRank, progressToNextLevel, nextLevelAt } = seasonProgress;
  const { rewardItems } = defs.Progression.get(seasonPassProgressionHash!);

  // Get the reward item for the next progression level
  // TODO: check for premium rewards
  const nextRewardItem = rewardItems
    .filter((item) => item.rewardedAtProgressionLevel === seasonalRank + 1)
    .find((item) => item.uiDisplayStyle === 'free');

  // Get the item info
  const freeItem = defs.InventoryItem.get(nextRewardItem!.itemHash);

  return (
    <div className="seasonal-rank milestone-quest">
      <div className="milestone-icon">
        <BungieImage
          className="perk milestone-img"
          src={freeItem.displayProperties.icon}
          title={freeItem.displayProperties.description}
        />
        {/* TODO: check for premium rewards */}
        {/* <BungieImage
          className="perk milestone-img"
          src={freeItem.displayProperties.icon}
          title={freeItem.displayProperties.description}
        /> */}
        <span>
          {formatter.format(progressToNextLevel)}
          <wbr />/<wbr />
          {formatter.format(nextLevelAt)}
        </span>
      </div>
      <div className="milestone-info">
        <span className="milestone-name">Rank {seasonalRank}</span>
        <div className="milestone-description">{seasonNameDisplay}</div>
      </div>
    </div>
  );
}
