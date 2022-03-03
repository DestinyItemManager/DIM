import BungieImage from 'app/dim-ui/BungieImage';
import PressTip from 'app/dim-ui/PressTip';
import { useD2Definitions } from 'app/manifest/selectors';
import React from 'react';
import './ActivityModifier.scss';

export function ActivityModifier({ modifierHash }: { modifierHash: number }) {
  const defs = useD2Definitions()!;

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
