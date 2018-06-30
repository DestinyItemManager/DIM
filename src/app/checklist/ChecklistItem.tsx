import * as React from 'react';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions.service';
import classNames from 'classnames';
import './checklist.scss';

/**
 * The profile checklist points to a checklist category, which points to a checklist item,
 * which has a boolean entry.
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
      <div className={classNames('checklist-item', { complete: checklistItemCompleted })}>
        <div className="checklist-item-name">
          <i className={classNames('fa', checkClass)}/>
          {checklistItemDef.displayProperties.name}
        </div>
        <div className="checklist-item-description">
          {checklistItemDef.displayProperties.description}
        </div>
      </div>
    );
  }

  return null;
}
