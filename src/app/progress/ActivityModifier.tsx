import React from 'react';
import BungieImage from '../dim-ui/BungieImage';
import PressTip from '../dim-ui/PressTip';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import './ActivityModifier.scss';

export function ActivityModifier(props: { modifierHash: number; defs: D2ManifestDefinitions }) {
  const { modifierHash, defs } = props;

  const modifier = defs.ActivityModifier.get(modifierHash);
  if (!modifier) {
    return null;
  }

  return (
    <div className="milestone-modifier">
      <BungieImage src={modifier.displayProperties.icon} alt="" />
      <div className="milestone-modifier-info">
        <PressTip tooltip={modifier.displayProperties.description}>
          <div className="milestone-modifier-name">{modifier.displayProperties.name}</div>
        </PressTip>
      </div>
    </div>
  );
}
