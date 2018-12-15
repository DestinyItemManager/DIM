import { DestinyProgression } from 'bungie-api-ts/destiny2';
import * as React from 'react';
import { t } from 'i18next';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions.service';
import './faction.scss';
import BungieImage, { bungieNetPath } from '../dim-ui/BungieImage';
import './CrucibleRank.scss';
import * as _ from 'lodash';

interface CrucibleRankProps {
  progress: DestinyProgression;
  defs: D2ManifestDefinitions;
}

export function CrucibleRank(props: CrucibleRankProps) {
  const { defs, progress } = props;

  const progressionDef = defs.Progression.get(progress.progressionHash);

  const step = progressionDef.steps[Math.min(progress.level, progressionDef.steps.length - 1)];

  const rankTotal = _.sumBy(progressionDef.steps, (cur) => cur.progressTotal);

  return (
    <div className="faction activity-rank" title={progressionDef.displayProperties.description}>
      <div>
        <CrucibleRankIcon progress={progress} defs={defs} />
      </div>
      <div className="faction-info">
        <div className="faction-level">{progressionDef.displayProperties.name}</div>
        <div className="faction-name">{step.stepName}</div>
        <div className="faction-level">
          <BungieImage className="rank-icon" src={progressionDef.rankIcon} />
          {progress.currentProgress} ({progress.progressToNextLevel} / {progress.nextLevelAt})
        </div>
        <div className="faction-level">
          {t('Progress.PercentPrestige', {
            pct: Math.round((progress.currentProgress / rankTotal) * 100)
          })}
        </div>
      </div>
    </div>
  );
}

function CrucibleRankIcon(props: { progress: DestinyProgression; defs: D2ManifestDefinitions }) {
  const { progress, defs } = props;

  const progressionDef = defs.Progression.get(progress.progressionHash);

  const step = progressionDef.steps[Math.min(progress.level, progressionDef.steps.length - 1)];

  const rankTotal = _.sumBy(progressionDef.steps, (step) => step.progressTotal);

  const circumference = 2 * 22 * Math.PI;
  const circumference2 = 2 * 25 * Math.PI;

  return (
    <div className="crucible-rank-icon">
      <svg viewBox="0 0 54 54">
        <circle r="27" cx="27" cy="27" fill="#555" />
        <circle r="21" cx="27" cy="27" fill="#222" />
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
            stroke={`rgb(${progressionDef.color.red}, ${progressionDef.color.green},${
              progressionDef.color.blue
            })`}
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
        <image xlinkHref={bungieNetPath(step.icon)} width="40" height="40" x="7" y="7" />
      </svg>
    </div>
  );
}
