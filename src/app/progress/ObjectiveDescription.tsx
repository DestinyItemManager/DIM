import RichDestinyText from 'app/dim-ui/RichDestinyText';
import { DestinyObjectiveDefinition } from 'bungie-api-ts/destiny2';
import React from 'react';
import { D1ManifestDefinitions } from '../destiny1/d1-definitions';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions';
import BungieImage from '../dim-ui/BungieImage';

export default function ObjectiveDescription({
  progressDescription,
  objectiveDef,
  defs,
}: {
  progressDescription: string;
  objectiveDef?: DestinyObjectiveDefinition;
  defs?: D2ManifestDefinitions | D1ManifestDefinitions;
}) {
  return (
    <div className="objective-description">
      {objectiveDef?.displayProperties.hasIcon && (
        <BungieImage src={objectiveDef.displayProperties.icon} />
      )}
      <RichDestinyText text={progressDescription} defs={defs} />
    </div>
  );
}
