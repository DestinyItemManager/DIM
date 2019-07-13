import React from 'react';
import { isWellRested } from '../inventory/store/well-rested';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions.service';
import BungieImage from '../dim-ui/BungieImage';
import { DestinyCharacterProgressionComponent } from 'bungie-api-ts/destiny2';

export default function WellRestedPerkIcon({
  defs,
  progressions
}: {
  defs: D2ManifestDefinitions;
  progressions: DestinyCharacterProgressionComponent;
}) {
  const wellRestedInfo = isWellRested(defs, progressions);

  if (!wellRestedInfo.wellRested) {
    return null;
  }
  const formatter = new Intl.NumberFormat(window.navigator.language);
  const perkDisplay = defs.SandboxPerk.get(1519921522).displayProperties;
  return (
    <div className="well-rested milestone-quest">
      <div className="milestone-icon">
        <BungieImage className="perk" src={perkDisplay.icon} title={perkDisplay.description} />
        <span>
          {formatter.format(wellRestedInfo.progress!)}
          <wbr />/<wbr />
          {formatter.format(wellRestedInfo.requiredXP!)}
        </span>
      </div>
      <div className="milestone-info">
        <span className="milestone-name">{perkDisplay.name}</span>
        <div className="milestone-description">{perkDisplay.description}</div>
      </div>
    </div>
  );
}
