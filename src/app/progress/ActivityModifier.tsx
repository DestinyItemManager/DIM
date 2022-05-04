import { useD2Definitions } from 'app/manifest/selectors';
import React from 'react';
import BungieImage from '../dim-ui/BungieImage';
import PressTip from '../dim-ui/PressTip';
import './ActivityModifier.scss';

export function ActivityModifier({ modifierHash }: { modifierHash: number }) {
  const defs = useD2Definitions()!;

  const modifier = defs.ActivityModifier.get(modifierHash);
  const modifierName = modifier.displayProperties.name;
  const modifierIcon = modifier.displayProperties.icon;

  if (!modifier || (!modifierName && !modifierIcon)) {
    return null;
  }

  return (
    <div className="milestone-modifier">
      {Boolean(modifierIcon) && <BungieImage src={modifierIcon} />}
      {Boolean(modifierName) && (
        <div className="milestone-modifier-info">
          <PressTip tooltip={modifier.displayProperties.description}>
            <div className="milestone-modifier-name">{modifierName}</div>
          </PressTip>
        </div>
      )}
    </div>
  );
}
