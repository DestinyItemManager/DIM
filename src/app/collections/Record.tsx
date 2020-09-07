import { trackTriumph } from 'app/dim-api/basic-actions';
import { trackedTriumphsSelector } from 'app/dim-api/selectors';
import { t } from 'app/i18next-t';
import { Reward } from 'app/progress/Reward';
import { percent } from 'app/shell/filters';
import { RootState } from 'app/store/types';
import {
  DestinyObjectiveProgress,
  DestinyRecordComponent,
  DestinyRecordDefinition,
  DestinyRecordState,
  DestinyUnlockValueUIStyle,
} from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import catalystIcons from 'data/d2/catalyst-triumph-icons.json';
import dimTrackedIcon from 'images/dimTrackedIcon.svg';
import trackedIcon from 'images/trackedIcon.svg';
import _ from 'lodash';
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import ishtarIcon from '../../images/ishtar-collective.svg';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions';
import BungieImage from '../dim-ui/BungieImage';
import ExternalLink from '../dim-ui/ExternalLink';
import Objective from '../progress/Objective';
import { DimRecord } from './presentation-nodes';
import './Record.scss';

interface Props {
  record: DimRecord;
  defs: D2ManifestDefinitions;
  completedRecordsHidden: boolean;
  redactedRecordsRevealed: boolean;
}

interface RecordInterval {
  objective: DestinyObjectiveProgress;
  score: number;
  percentCompleted: number;
  isRedeemed: boolean;
}

const overrideIcons = Object.keys(catalystIcons).map(Number);

export default function Record({
  record,
  defs,
  completedRecordsHidden,
  redactedRecordsRevealed,
}: Props) {
  const { recordDef, trackedInGame, recordComponent } = record;
  const state = recordComponent.state;
  const recordHash = recordDef.hash;
  const dispatch = useDispatch();

  const acquired = Boolean(state & DestinyRecordState.RecordRedeemed);
  const unlocked = !acquired && !(state & DestinyRecordState.ObjectiveNotCompleted);
  const obscured =
    !redactedRecordsRevealed &&
    !unlocked &&
    !acquired &&
    Boolean(state & DestinyRecordState.Obscured);
  const trackedInDim = useSelector((state: RootState) =>
    trackedTriumphsSelector(state).includes(recordHash)
  );
  const loreLink =
    !obscured &&
    recordDef.loreHash &&
    `http://www.ishtar-collective.net/entries/${recordDef.loreHash}`;

  const name = obscured ? t('Progress.SecretTriumph') : recordDef.displayProperties.name;
  const description = obscured
    ? recordDef.stateInfo.obscuredString
    : recordDef.displayProperties.description;

  const recordIcon = overrideIcons.includes(recordHash)
    ? catalystIcons[recordHash]
    : recordDef.displayProperties.icon;

  if (completedRecordsHidden && acquired) {
    return null;
  }

  const intervals = getIntervals(recordDef, recordComponent);
  const intervalBarStyle = {
    width: `calc((100% / ${intervals.length}) - 2px)`,
  };
  const allIntervalsCompleted = intervals.every((i) => i.percentCompleted >= 1.0);
  const intervalProgressBar = !obscured && intervals.length > 0 && (
    <div
      className={clsx('record-interval-container', {
        complete: allIntervalsCompleted,
      })}
    >
      {!allIntervalsCompleted &&
        intervals.map((i) => {
          const redeemed = i.isRedeemed;
          const unlocked = i.percentCompleted >= 1.0;
          return (
            <div
              key={i.objective.objectiveHash}
              className={clsx('record-interval', {
                redeemed,
                unlocked: unlocked && !redeemed,
              })}
              style={intervalBarStyle}
            >
              {!(redeemed || unlocked) && (
                <div
                  className="record-interval unlocked"
                  style={{ width: percent(i.percentCompleted) }}
                />
              )}
            </div>
          );
        })}
    </div>
  );

  let scoreValue = <>{t('Progress.RecordValue', { value: recordDef.completionInfo.ScoreValue })}</>;
  if (intervals.length > 1) {
    const currentScore = _.sumBy(
      _.take(intervals, recordComponent.intervalsRedeemedCount),
      (i) => i.score
    );
    const totalScore = _.sumBy(intervals, (i) => i.score);
    scoreValue = (
      <>
        <span className="current">{currentScore}</span> /{' '}
        {t('Progress.RecordValue', { value: totalScore })}
      </>
    );
  }

  const objectives =
    intervals.length > 0
      ? [
          intervals[Math.min(recordComponent.intervalsRedeemedCount, intervals.length - 1)]
            .objective,
        ]
      : recordComponent.objectives;
  const showObjectives =
    !obscured &&
    objectives &&
    ((!obscured && objectives.length > 1) ||
      (objectives.length === 1 &&
        !(
          defs.Objective.get(objectives[0].objectiveHash).valueStyle ===
            DestinyUnlockValueUIStyle.Checkbox ||
          (objectives[0].completionValue === 1 &&
            !defs.Objective.get(objectives[0].objectiveHash).allowOvercompletion)
        )));

  // TODO: show track badge greyed out / on hover
  // TODO: track on click
  const toggleTracked = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch(trackTriumph({ recordHash, tracked: !trackedInDim }));
  };

  return (
    <div
      className={clsx('triumph-record', {
        redeemed: acquired,
        unlocked,
        obscured,
        tracked: trackedInGame,
        trackedInDim,
        multistep: intervals.length > 0,
      })}
    >
      {recordIcon && <BungieImage className="record-icon" src={recordIcon} />}
      <div className="record-info">
        {!obscured && recordDef.completionInfo && <div className="record-value">{scoreValue}</div>}
        <h3>{name}</h3>
        {description && <p>{description}</p>}
        {showObjectives && (
          <div className="record-objectives">
            {objectives.map((objective) => (
              <Objective key={objective.objectiveHash} objective={objective} defs={defs} />
            ))}
          </div>
        )}
        {loreLink && (
          <div className="record-lore">
            <ExternalLink href={loreLink}>
              <img src={ishtarIcon} height="16" width="16" />
            </ExternalLink>
            <ExternalLink href={loreLink}>{t('MovePopup.ReadLore')}</ExternalLink>
          </div>
        )}
        {recordDef.rewardItems?.length > 0 &&
          !acquired &&
          !obscured &&
          recordDef.rewardItems.map((reward) => (
            <Reward key={reward.itemHash} reward={reward} defs={defs} />
          ))}
        {trackedInGame && <img className="trackedIcon" src={trackedIcon} />}
        {(!acquired || trackedInDim) && (
          <div role="button" onClick={toggleTracked} className="dimTrackedIcon">
            <img src={dimTrackedIcon} />
          </div>
        )}
      </div>
      {intervalProgressBar}
    </div>
  );
}

function getIntervals(
  definition: DestinyRecordDefinition,
  record: DestinyRecordComponent
): RecordInterval[] {
  const intervalDefinitions = definition?.intervalInfo?.intervalObjectives || [];
  const intervalObjectives = record?.intervalObjectives || [];
  if (intervalDefinitions.length !== intervalObjectives.length) {
    return [];
  }

  const intervals: RecordInterval[] = [];
  let isPrevIntervalComplete = true;
  let prevIntervalProgress = 0;
  for (let i = 0; i < intervalDefinitions.length; i++) {
    const def = intervalDefinitions[i];
    const data = intervalObjectives[i];

    intervals.push({
      objective: data,
      score: def.intervalScoreValue,
      percentCompleted: isPrevIntervalComplete
        ? data.complete
          ? 1
          : Math.max(
              0,
              ((data.progress || 0) - prevIntervalProgress) /
                (data.completionValue - prevIntervalProgress)
            )
        : 0,
      isRedeemed: record.intervalsRedeemedCount >= i + 1,
    });

    isPrevIntervalComplete = data.complete;
    prevIntervalProgress = data.completionValue;
  }
  return intervals;
}
