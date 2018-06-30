// import {
//   DestinyMilestone,
//   DestinyCharacterComponent,
//   DestinyProgressionDefinition
// } from 'bungie-api-ts/destiny2';
import * as React from 'react';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions.service';
import BungieImage from '../dim-ui/BungieImage';
import './milestone.scss';
import { ChecklistItem } from './ChecklistItem';
// import RewardActivity from './RewardActivity';
// import AvailableQuest from './AvailableQuest';
// import { UISref } from '@uirouter/react';

/**
 * A Milestone is an activity or event that a player can complete to earn rewards.
 * There are several forms of Milestone.
 */
export function Checklist({
  checklistDefinitionHash,
  profileChecklist,
  defs
}: {
  checklistDefinitionHash: number;
  profileChecklist: { [key: number]: { [key: number]: boolean } };
  defs: D2ManifestDefinitions;
}) {
  const checklistDef = defs.Checklist.get(checklistDefinitionHash);

  const nestedChecklistHashes = Object.keys(profileChecklist[checklistDefinitionHash]).map(Number);

  console.log(nestedChecklistHashes);

  return (
  <div className="milestone-quest">
    {checklistDef.displayProperties.hasIcon &&
    <>
      <div className="milestone-icon">
        <BungieImage src={checklistDef.displayProperties.icon} />
      </div>
    </>
    }
    <div class-name="milestone-info">
      <span className="milestone-name">{checklistDef.displayProperties.name}</span>
      <div className="milestone-description">
        {checklistDef.displayProperties.description}
      </div>
      {nestedChecklistHashes.map((checklistItemHash) =>
        <ChecklistItem
          key={checklistItemHash}
          checklistDefinitionHash={checklistDefinitionHash}
          checklistItemHash={checklistItemHash}
          profileChecklist={profileChecklist}
          defs={defs}
        />
      )}
    </div>
  </div>
  );
}
