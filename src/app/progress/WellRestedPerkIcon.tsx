import React from 'react';
import { isWellRested } from '../inventory/store/well-rested';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions';
import BungieImage from '../dim-ui/BungieImage';
import {
  DestinyCharacterProgressionComponent,
  DestinySeasonDefinition,
  DestinySeasonPassDefinition,
} from 'bungie-api-ts/destiny2';
import { WELL_RESTED_PERK } from 'app/search/d2-known-values';

export default function WellRestedPerkIcon({
  defs,
  progressions,
  season,
  seasonPass,
}: {
  defs: D2ManifestDefinitions;
  progressions: DestinyCharacterProgressionComponent;
  season: DestinySeasonDefinition | undefined;
  seasonPass?: DestinySeasonPassDefinition;
}) {
  const wellRestedInfo = isWellRested(defs, season, seasonPass, progressions);

  if (!wellRestedInfo.wellRested) {
    return null;
  }
  const wellRestedPerk = defs.SandboxPerk.get(WELL_RESTED_PERK);
  if (!wellRestedPerk) {
    console.error("Couldn't find Well Rested perk in manifest");
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
