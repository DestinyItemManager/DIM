import React from 'react';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions.service';
import classNames from 'classnames';
import { D2RaidEncounters } from './d2-raid-encounters-info';

export default function Encounter({
  defs,
  index,
  completed,
  phasehash
}: {
  defs: D2ManifestDefinitions;
  index: number;
  completed: boolean;
  phasehash: number;
}) {
  const displayName =
    (D2RaidEncounters[phasehash] &&
      defs &&
      defs.Objective.get(D2RaidEncounters[phasehash]) &&
      defs.Objective.get(D2RaidEncounters[phasehash]).progressDescription) ||
    `Encounter ${index + 1} - ${phasehash}`;

  const classes = classNames('objective-row', 'objective-boolean', phasehash, {
    'objective-complete': completed
  });

  return (
    <div className={classes}>
      <div className="objective-checkbox">
        <div />
      </div>
      <div className="objective-progress">
        <div className="objective-description">{displayName}</div>
      </div>
    </div>
  );
}
