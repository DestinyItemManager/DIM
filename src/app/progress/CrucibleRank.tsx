import {
  DestinyProgression
} from 'bungie-api-ts/destiny2';
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

  const step = progressionDef.steps[progress.level];

  console.log(progress);

  return (
    <div className="faction" title={progressionDef.displayProperties.description}>
      <div><CrucibleRankIcon progress={progress} defs={defs}/></div>
      <div className="faction-info">
        <div className="faction-level">{progressionDef.displayProperties.name}</div>
        <div className="faction-name">{step.stepName}</div>
        <div className="faction-level">
          {progress.progressToNextLevel} / {progress.nextLevelAt}
        </div>
      </div>
    </div>
  );
}

function CrucibleRankIcon(props: {
  progress: DestinyProgression;
  defs: D2ManifestDefinitions;
}) {
  const { progress, defs } = props;

  const progessionDef = defs.Progression.get(progress.progressionHash);

  const step = progessionDef.steps[progress.level];

  const circumference = 2 * 22 * Math.PI;

  return (
    <div className="crucible-rank-icon">
      <svg viewBox="0 0 48 48">
        <circle
          r="24"
          cx="24"
          cy="24"
          fill="#555"
        />
        <circle
          r="21"
          cx="24"
          cy="24"
          fill="#353535"
        />
        {progress.progressToNextLevel > 0 &&
          <circle
            r="22"
            cx="-24"
            cy="24"
            transform="rotate(-90)"
            className="crucible-rank-progress"
            strokeWidth="3"
            strokeDasharray={`${circumference * progress.progressToNextLevel / progress.nextLevelAt} ${circumference}`}
          />}
        <image xlinkHref={bungieNetPath(step.icon)} width="44" height="44" x="2" y="2" />
      </svg>
    </div>
  );
}
