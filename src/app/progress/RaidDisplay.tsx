import {
  DestinyDisplayPropertiesDefinition,
  DestinyMilestoneActivityPhase
} from 'bungie-api-ts/destiny2';
import React from 'react';
import BungieImage from '../dim-ui/BungieImage';
import Phase from './Phase';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions.service';
import { ActivityModifier } from './ActivityModifier';

interface Props {
  displayProperties: DestinyDisplayPropertiesDefinition;
  children?: React.ReactNode;
}

// outer wrapper of a Raid & its icon
export function RaidDisplay(props: Props) {
  const { displayProperties, children } = props;

  return (
    <div className="milestone-quest">
      <div className="milestone-icon">
        {displayProperties.hasIcon && <BungieImage src={displayProperties.icon} />}
      </div>
      <div className="milestone-info">{children}</div>
    </div>
  );
}

// Raid Activity, describing phases and its difficulty tier if applicable
export function RaidActivity({
  defs,
  activityHash,
  displayName,
  phases,
  modifierHashes
}: {
  defs: D2ManifestDefinitions;
  activityHash: number;
  displayName: string;
  phases: DestinyMilestoneActivityPhase[];
  modifierHashes: number[];
}) {
  const modifiers = (modifierHashes || []).map((h) => defs.ActivityModifier.get(h));

  // manifest-localized string describing raid segments with loot
  const encountersString = defs.Objective.get(3133307686).progressDescription;

  // use milestone name if there's only 1 tier of the raid
  const activityName = displayName || defs.Activity.get(activityHash).displayProperties.name;

  return (
    <div className="raid-tier">
      <span className="milestone-name">{activityName}</span>
      <div className="quest-modifiers">
        {modifiers.map((modifier) => (
          <ActivityModifier key={modifier.hash} modifier={modifier} />
        ))}
      </div>
      <div className="quest-objectives">
        <div className="objective-row objective-boolean">
          {phases.map((phase) => (
            <Phase key={phase.phaseHash} completed={phase.complete} />
          ))}
          <div className="objective-progress">
            <div className="objective-description">{encountersString}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
