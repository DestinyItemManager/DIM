import * as React from 'react';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions.service';
import BungieImage from '../dim-ui/BungieImage';
import './checklist.scss';
import { ChecklistItem } from './ChecklistItem';

/**
 * This is meant to track profile-wide checklist progression.
 * It can probably also be used to track character-level checklist progression.
 */
export function ChecklistCategory({
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
  <div className="checklist-category">
    {checklistDef.displayProperties.hasIcon &&
    <>
      <div className="checklist-category-icon">
        <BungieImage src={checklistDef.displayProperties.icon} />
      </div>
    </>
    }
    <div className="checklist-category-info">
      <div className="title checklist-title">{checklistDef.displayProperties.name}</div>
      <div className="checklist-category-description">
        {checklistDef.displayProperties.description}
      </div>
      <div className="checklist-items">
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
  </div>
  );
}
