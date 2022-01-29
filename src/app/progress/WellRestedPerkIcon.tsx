import { useD2Definitions } from 'app/manifest/selectors';
import { WELL_RESTED_PERK } from 'app/search/d2-known-values';
import {
  DestinyCharacterProgressionComponent,
  DestinySeasonDefinition,
  DestinySeasonPassDefinition,
} from 'bungie-api-ts/destiny2';
import React from 'react';
import BungieImage from '../dim-ui/BungieImage';
import { isWellRested } from '../inventory-stores/store/well-rested';

export default function WellRestedPerkIcon({
  progressions,
  season,
  seasonPass,
}: {
  progressions: DestinyCharacterProgressionComponent;
  season: DestinySeasonDefinition | undefined;
  seasonPass?: DestinySeasonPassDefinition;
}) {
  const defs = useD2Definitions()!;
  const wellRestedInfo = isWellRested(defs, season, seasonPass, progressions);

  if (!wellRestedInfo.wellRested) {
    return null;
  }
  const wellRestedPerk = defs.SandboxPerk.get(WELL_RESTED_PERK);
  if (!wellRestedPerk) {
    return null;
  }
  const perkDisplay = wellRestedPerk.displayProperties;
  return (
    <div className="well-rested milestone-quest">
      <div className="milestone-icon">
        <BungieImage
          className="perk milestone-img"
          src={perkDisplay.icon}
          title={perkDisplay.description}
        />
        {wellRestedInfo.progress !== undefined && wellRestedInfo.requiredXP !== undefined && (
          <span>
            {wellRestedInfo.progress.toLocaleString()}
            <wbr />/<wbr />
            {wellRestedInfo.requiredXP.toLocaleString()}
          </span>
        )}
      </div>
      <div className="milestone-info">
        <span className="milestone-name">{perkDisplay.name}</span>
        <div className="milestone-description">{perkDisplay.description}</div>
      </div>
    </div>
  );
}
