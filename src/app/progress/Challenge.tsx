import {
  DestinyChallengeStatus,
} from 'bungie-api-ts/destiny2';
import classNames from 'classnames';
import * as React from 'react';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions.service';

/**
 * A single challenge. A lot like an objective, but we display it closer to how it appears in-game.
 */
export default function Challenge({
  defs,
  challenge
}: {
  defs: D2ManifestDefinitions;
  challenge: DestinyChallengeStatus;
}) {
  const objectiveDef = defs.Objective.get(challenge.objective.objectiveHash);
  const icon = challenge.objective.complete ? 'fa-check-circle' : 'fa-circle-o';

  return (
    <div
     className={classNames('milestone-challenge', { complete: challenge.objective.complete })}
     title={objectiveDef.displayProperties.description}
    >
    <i className={classNames('fa', icon)}/>
      <div className="milestone-challenge-info">
        <div className="milestone-header">
          <span className="milestone-challenge-name">{objectiveDef.displayProperties.name}</span>
          {challenge.objective.completionValue > 1 &&
            <span className="milestone-challenge-progress">{challenge.objective.progress || 0}/{challenge.objective.completionValue}</span>
          }
        </div>
        <div className="milestone-challenge-description">{objectiveDef.displayProperties.description}</div>
      </div>
    </div>
  );
}
