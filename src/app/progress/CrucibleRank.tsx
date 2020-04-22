import { DestinyProgression } from 'bungie-api-ts/destiny2';
import React from 'react';
import { t } from 'app/i18next-t';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions';
import BungieImage, { bungieNetPath } from '../dim-ui/BungieImage';
import CompletionCheckbox from './CompletionCheckbox';
import './faction.scss';
import './CrucibleRank.scss';
import _ from 'lodash';

interface CrucibleRankProps {
  progress: DestinyProgression;
  resets: DestinyProgression;
  streak: DestinyProgression;
  defs: D2ManifestDefinitions;
}

/**
 * displays a single Crucible or Gambit rank for the account
 */
export function CrucibleRank(props: CrucibleRankProps) {
  const { defs, progress, resets, streak } = props;

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
        <CrucibleRankIcon progress={progress} defs={defs} />
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
            pct: Math.round((progress.currentProgress / rankTotal) * 100)
          })}
        </div>
        {Boolean(resets.currentResetCount) && (
          <div className="faction-level">
            {t('Progress.Resets', { count: resets.currentResetCount })}
          </div>
        )}
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
