import { t } from 'app/i18next-t';
import { useD2Definitions } from 'app/manifest/selectors';
import { DestinyProgression } from 'bungie-api-ts/destiny2';
import _ from 'lodash';
import React from 'react';
import BungieImage, { bungieNetPath } from '../dim-ui/BungieImage';
import CompletionCheckbox from './CompletionCheckbox';
import './CrucibleRank.scss';
import './faction.scss';

interface CrucibleRankProps {
  progress: DestinyProgression;
  streak: DestinyProgression;
}

/**
 * displays a single Crucible or Gambit rank for the account
 */
export function CrucibleRank({ progress, streak }: CrucibleRankProps) {
  const defs = useD2Definitions()!;
  const progressionDef = defs.Progression.get(progress.progressionHash);

  const step = progressionDef.steps[Math.min(progress.level, progressionDef.steps.length - 1)];

  const rankTotal = _.sumBy(progressionDef.steps, (cur) => cur.progressTotal);

  const streakCheckboxes = Array(5).fill(true).fill(false, streak.stepIndex);

  // language-agnostic css class name to identify which rank type we are in
  const factionClass = `faction-${progress.progressionHash}`;

  return (
    <div
      className={`faction activity-rank ${factionClass}`}
      title={progressionDef.displayProperties.description}
    >
      <div>
        <CrucibleRankIcon progress={progress} />
      </div>
      <div className="faction-info">
        <div className="faction-level">{progressionDef.displayProperties.name}</div>
        <div className="faction-name">{step.stepName}</div>
        <div className="faction-level">
          <BungieImage className="rank-icon" src={progressionDef.rankIcon} />
          {progress.currentProgress} ({progress.progressToNextLevel} / {progress.nextLevelAt})
        </div>
        <div className="win-streak objective-row">
          {streakCheckboxes.map((c, i) => (
            <CompletionCheckbox key={i} completed={c} />
          ))}
        </div>
        <div className="faction-level">
          {t('Progress.PercentPrestige', {
            pct: Math.round((progress.currentProgress / rankTotal) * 100),
          })}
        </div>
        {Boolean(progress.currentResetCount) && (
          <div className="faction-level">
            {t('Progress.Resets', { count: progress.currentResetCount })}
          </div>
        )}
      </div>
    </div>
  );
}

function CrucibleRankIcon({ progress }: { progress: DestinyProgression }) {
  const defs = useD2Definitions()!;

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
            strokeDasharray={`${
              (circumference * progress.progressToNextLevel) / progress.nextLevelAt
            } ${circumference}`}
            stroke={`rgb(${progressionDef.color.red}, ${progressionDef.color.green},${progressionDef.color.blue})`}
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
            strokeDasharray={`${
              (circumference2 * progress.currentProgress) / rankTotal
            } ${circumference2}`}
          />
        )}
        <image xlinkHref={bungieNetPath(step.icon)} width="40" height="40" x="7" y="7" />
      </svg>
    </div>
  );
}
