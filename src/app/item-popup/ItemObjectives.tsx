import React from 'react';
import _ from 'lodash';
import './ItemObjectives.scss';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions';
import { SupplementalObjectives } from 'app/progress/SupplementalObjectives';
import Objective from 'app/progress/Objective';
import { D2SupplementalManifestDefinitions } from 'app/progress/D2SupplementalManifestDefinitions';
import { D1ManifestDefinitions } from 'app/destiny1/d1-definitions';
import { DestinyObjectiveProgress } from 'bungie-api-ts/destiny2';

export default function ItemObjectives({
  itemHash,
  objectives,
  defs
}: {
  itemHash: number;
  objectives: DestinyObjectiveProgress[] | null;
  defs: D2ManifestDefinitions | D1ManifestDefinitions;
}) {
  // TODO: get rid of this
  const supplementalObjectives = SupplementalObjectives.get(itemHash);

  if ((!objectives || !objectives.length) && !supplementalObjectives.length) {
    return null;
  }

  return (
    <div className="item-objectives item-details">
      {objectives &&
        objectives.map((objective) => (
          <Objective defs={defs} objective={objective} key={objective.objectiveHash} />
        ))}
      {supplementalObjectives.map((objective) => (
        <Objective
          defs={D2SupplementalManifestDefinitions}
          objective={objective}
          key={objective.objectiveHash}
        />
      ))}
    </div>
  );
}
