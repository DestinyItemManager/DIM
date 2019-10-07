import React from 'react';
import clsx from 'clsx';
import { DimObjective } from '../inventory/item-types';
import { AppIcon } from '../shell/icons';
import { faCircle } from '@fortawesome/free-solid-svg-icons';
import _ from 'lodash';
import './ItemObjectives.scss';
import ObjectiveDescription from '../progress/ObjectiveDescription';
import { percent } from '../shell/filters';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions';
import { SupplementalObjectives } from 'app/progress/SupplementalObjectives';
import Objective from 'app/progress/Objective';
import { D2SupplementalManifestDefinitions } from 'app/progress/D2SupplementalManifestDefinitions';

export default function ItemObjectives({
  itemHash,
  objectives,
  defs
}: {
  itemHash: number;
  objectives: DimObjective[] | null;
  defs?: D2ManifestDefinitions;
}) {
  const supplementalObjectives = SupplementalObjectives.get(itemHash);

  if ((!objectives || !objectives.length) && !supplementalObjectives.length) {
    return null;
  }

  return (
    <div className="item-objectives item-details">
      {objectives &&
        objectives.map((objective) => (
          <div
            key={objective.displayName}
            title={objective.description}
            className={clsx('objective-row', {
              'objective-complete': objective.complete,
              'objective-boolean': objective.boolean
            })}
          >
            {objective.displayStyle === 'trials' ? (
              <div>
                {_.times(objective.completionValue, ($index) => (
                  <AppIcon
                    icon={faCircle}
                    className={clsx('trials', {
                      incomplete: $index >= objective.progress,
                      wins: objective.completionValue === 9
                    })}
                  />
                ))}
                {objective.completionValue === 9 && objective.progress > 9 && (
                  <span>+ {objective.progress - 9}</span>
                )}
              </div>
            ) : objective.displayStyle === 'integer' ? (
              <div className="objective-integer">
                <ObjectiveDescription displayName={objective.displayName} defs={defs} />
                <div className="objective-text">{objective.display}</div>
              </div>
            ) : (
              <>
                <div className="objective-checkbox" />
                <div className="objective-progress">
                  {!objective.boolean && (
                    <div
                      className="objective-progress-bar"
                      style={{ width: percent(objective.progress / objective.completionValue) }}
                    />
                  )}
                  <ObjectiveDescription displayName={objective.displayName} defs={defs} />
                  {!objective.boolean && <div className="objective-text">{objective.display}</div>}
                </div>
              </>
            )}
          </div>
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
