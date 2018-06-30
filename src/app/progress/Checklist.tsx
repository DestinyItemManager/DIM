// import {
//   DestinyMilestone,
//   DestinyCharacterComponent,
//   DestinyProgressionDefinition
// } from 'bungie-api-ts/destiny2';
import * as React from 'react';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions.service';
// import BungieImage from '../dim-ui/BungieImage';
import './milestone.scss';
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

  const nestedChecklistHashes = Object.keys(profileChecklist[checklistDefinitionHash]);

  console.log(nestedChecklistHashes);

  return (<div className="checklist-header">{checklistDef.displayProperties.name}</div>);

  //   console.log(`${checklistDef.displayProperties.name}`);

  //   nestedChecklistHashes.forEach((nclh) => {
  //     const nestedChecklistHash = Number(nclh);

  //     const matchingChecklistEntry = checklistDef.entries.find((cld) => cld.hash === nestedChecklistHash);

  //     if (matchingChecklistEntry) {
  //       console.log(`${matchingChecklistEntry.displayProperties.name} - ${profileChecklist[checklistHash][nestedChecklistHash]}`);
  //     }
  //   });
  // });

  // return null;
}
