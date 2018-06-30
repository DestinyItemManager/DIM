import * as React from 'react';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions.service';
import BungieImage from '../dim-ui/BungieImage';
import './milestone.scss';
import { ChecklistItem } from './ChecklistItem';

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

  const orderedNestedChecklistHashes = nestedChecklistHashes.sort((a, b) => {
    const firstEntry = checklistDef.entries.find((cld) => cld.hash === a);
    const secondEntry = checklistDef.entries.find((cld) => cld.hash === b);

    if (!firstEntry || !secondEntry) {
      return 0;
    }

    const firstEntryNumbers = firstEntry.displayProperties.name.match(/\d+/g);
    const secondEntryNumbers = secondEntry.displayProperties.name.match(/\d+/g);

    if (!firstEntryNumbers || !secondEntryNumbers) {
      return 0;
    }

    const firstEntryNumber = Number(firstEntryNumbers[0]);
    const secondEntryNumber = Number(secondEntryNumbers[0]);

    if (firstEntryNumber < secondEntryNumber) {
      return -1;
    }

    if (firstEntryNumber > secondEntryNumber) {
      return 1;
    }

    return 0;
  });

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
      {orderedNestedChecklistHashes.map((checklistItemHash) =>
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
