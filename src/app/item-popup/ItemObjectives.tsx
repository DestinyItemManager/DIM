import React from 'react';
import classNames from 'classnames';
import { DimObjective } from '../inventory/item-types';
import { AppIcon } from '../shell/icons';
import { faCircle } from '@fortawesome/free-solid-svg-icons';
import _ from 'lodash';
import './ItemObjectives.scss';
import ObjectiveDescription from '../progress/ObjectiveDescription';
import { percent } from '../shell/filters';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions.service';

export default function ItemObjectives({
  objectives,
  defs
}: {
  objectives: DimObjective[] | null;
  defs?: D2ManifestDefinitions;
}) {
  if (!objectives || !objectives.length) {
    return null;
  }

  return (
    <div className="item-objectives item-details">
      {objectives.map((objective) => (
        <div
          key={objective.displayName}
          title={objective.description}
          className={classNames('objective-row', {
            'objective-complete': objective.complete,
            'objective-boolean': objective.boolean
          })}
        >
          {objective.displayStyle === 'trials' ? (
            <div>
              {_.times(objective.completionValue, ($index) => (
                <AppIcon
                  icon={faCircle}
                  className={classNames('trials', {
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
              <div className="objective-checkbox">
                <div />
              </div>
              <div className="objective-progress">
                <div
                  className="objective-progress-bar"
                  style={{ width: percent(objective.progress / objective.completionValue) }}
                />
                <ObjectiveDescription displayName={objective.displayName} defs={defs} />
                <div className="objective-text">{objective.display}</div>
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
