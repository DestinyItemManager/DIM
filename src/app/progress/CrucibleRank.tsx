import { DestinyProgression } from 'bungie-api-ts/destiny2';
import * as React from 'react';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions.service';
import './faction.scss';
import { bungieNetPath } from '../dim-ui/BungieImage';
import './CrucibleRank.scss';

interface CrucibleRankProps {
  progress: DestinyProgression;
  defs: D2ManifestDefinitions;
}

export function CrucibleRank(props: CrucibleRankProps) {
  const { defs, progress } = props;

  const progressionDef = defs.Progression.get(progress.progressionHash);

  const step = progressionDef.steps[Math.min(progress.level, progressionDef.steps.length - 1)];

  const rankTotal = progressionDef.steps.reduce((prev, cur) => {
    return prev + cur.progressTotal;
  }, 0);

  return (
    <div className="faction" title={progressionDef.displayProperties.description}>
      <div>
        <CrucibleRankIcon progress={progress} defs={defs} />
      </div>
      <div className="faction-info">
        <div className="faction-level">{progressionDef.displayProperties.name}</div>
        <div className="faction-name">{step.stepName}</div>
        <div className="faction-level">
          {progress.progressToNextLevel} / {progress.nextLevelAt}
        </div>
        <div className="faction-level">
          {Math.round((progress.currentProgress / rankTotal) * 100)}%
        </div>
      </div>
    </div>
  );
}

function CrucibleRankIcon(props: { progress: DestinyProgression; defs: D2ManifestDefinitions }) {
  const { progress, defs } = props;

  const progressionDef = defs.Progression.get(progress.progressionHash);

  const step = progressionDef.steps[Math.min(progress.level, progressionDef.steps.length - 1)];

  const rankTotal = progressionDef.steps.reduce((prev, cur) => {
    return prev + cur.progressTotal;
  }, 0);

  const circumference = 2 * 22 * Math.PI;
  const circumference2 = 2 * 25 * Math.PI;

  return (
    <div className="crucible-rank-icon">
      <svg viewBox="0 0 54 54">
        <circle r="27" cx="27" cy="27" fill="#555" />
        <circle r="21" cx="27" cy="27" fill="#353535" />
        {progress.progressToNextLevel > 0 && (
          <circle
            r="22"
            cx="-27"
            cy="27"
            transform="rotate(-90)"
            className="crucible-rank-progress"
            strokeWidth="3"
            strokeDasharray={`${(circumference * progress.progressToNextLevel) /
              progress.nextLevelAt} ${circumference}`}
          />
        )}
        {progress.currentProgress > 0 && (
          <circle
            r="25"
            cx="-27"
            cy="27"
            transform="rotate(-90)"
            className="crucible-rank-total-progress"
            strokeWidth="3"
            strokeDasharray={`${(circumference2 * progress.currentProgress) /
              rankTotal} ${circumference2}`}
          />
        )}
        <image xlinkHref={bungieNetPath(step.icon)} width="44" height="44" x="5" y="5" />
      </svg>
    </div>
  );
}
