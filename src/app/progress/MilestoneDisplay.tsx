import { DestinyDisplayPropertiesDefinition } from 'bungie-api-ts/destiny2';
import * as React from 'react';
import BungieImage from '../dim-ui/BungieImage';

interface Props {
  progress?: React.ReactNode;
  description?: React.ReactNode;
  displayProperties: DestinyDisplayPropertiesDefinition;
  children?: React.ReactNode;
}

export default function MilestoneDisplay(props: Props) {
  const { progress, displayProperties, children, description } = props;

  return (
    <div className="milestone-quest">
      <div className="milestone-icon">
        {displayProperties.hasIcon && <BungieImage src={displayProperties.icon} />}
        {progress}
      </div>
      <div className="milestone-info">
        <span className="milestone-name">{displayProperties.name}</span>
        <div className="milestone-description">{description || displayProperties.description}</div>
        {children}
      </div>
    </div>
  );
}
