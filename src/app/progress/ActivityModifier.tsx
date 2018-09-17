import * as React from 'react';
import { DestinyActivityModifierDefinition } from 'bungie-api-ts/destiny2';
import BungieImage from '../dim-ui/BungieImage';
import PressTip from '../dim-ui/PressTip';

export function ActivityModifier(props: { modifier: DestinyActivityModifierDefinition }) {
  const { modifier } = props;

  return (
    <div className="milestone-modifier">
      <BungieImage src={modifier.displayProperties.icon} />
      <div className="milestone-modifier-info">
        <PressTip tooltip={modifier.displayProperties.description}>
          <div className="milestone-modifier-name">{modifier.displayProperties.name}</div>
        </PressTip>
      </div>
    </div>
  );
}
