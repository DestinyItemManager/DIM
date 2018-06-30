import * as React from 'react';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions.service';
import classNames from 'classnames';
import './milestone.scss';

/**
 * A Milestone is an activity or event that a player can complete to earn rewards.
 * There are several forms of Milestone.
 */
export function ChecklistItem({
  checklistDefinitionHash,
  checklistItemHash,
  profileChecklist,
  defs
}: {
  checklistDefinitionHash: number;
  checklistItemHash: number;
  profileChecklist: { [key: number]: { [key: number]: boolean } };
  defs: D2ManifestDefinitions;
}) {
  const checklistDef = defs.Checklist.get(checklistDefinitionHash);
  const checklistItemDef = checklistDef.entries.find((cld) => cld.hash === checklistItemHash);
  const checklistItemCompleted = profileChecklist[checklistDefinitionHash][checklistItemHash];
  const checkClass = (checklistItemCompleted ? 'fa-check-circle-o' : 'fa-circle-o');

  if (checklistItemDef) {
    return(
      <div className={classNames('milestone-reward-activity', { complete: checklistItemCompleted })}>
        <i className={classNames('fa', checkClass)}/>
        <span>{checklistItemDef.displayProperties.name}</span>
        <div className="milestone-description">
          {checklistItemDef.displayProperties.description}
        </div>
      </div>
    );
  }

  return null;
}
