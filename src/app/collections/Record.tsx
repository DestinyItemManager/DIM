import React from 'react';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions';
import {
  DestinyProfileResponse,
  DestinyScope,
  DestinyRecordDefinition,
  DestinyRecordState,
  DestinyRecordComponent,
  DestinyUnlockValueUIStyle,
  DestinyObjectiveProgress
} from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import './Record.scss';
import Objective from '../progress/Objective';
import BungieImage from '../dim-ui/BungieImage';
import { t } from 'app/i18next-t';
import ishtarIcon from '../../images/ishtar-collective.svg';
import ExternalLink from '../dim-ui/ExternalLink';
import trackedIcon from 'images/trackedIcon.svg';
import catalystIcons from 'data/d2/catalyst-triumph-icons.json';
import { percent } from 'app/shell/filters';
import _ from 'lodash';

interface Props {
  recordHash: number;
  defs: D2ManifestDefinitions;
  profileResponse: DestinyProfileResponse;
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
  recordHash,
  defs,
  profileResponse,
  completedRecordsHidden,
  redactedRecordsRevealed
}: Props) {
  const recordDef = defs.Record.get(recordHash);
  if (!recordDef) {
    return null;
  }
  const record = getRecordComponent(recordDef, profileResponse);

  if (record === undefined || record.state & DestinyRecordState.Invisible || recordDef.redacted) {
    return null;
  }

  const acquired = Boolean(record.state & DestinyRecordState.RecordRedeemed);
  const unlocked = !acquired && !(record.state & DestinyRecordState.ObjectiveNotCompleted);
  const obscured =
    !redactedRecordsRevealed &&
    !unlocked &&
    !acquired &&
    Boolean(record.state & DestinyRecordState.Obscured);
  const tracked = profileResponse?.profileRecords?.data?.trackedRecordHash === recordHash;
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

  const intervals = getIntervals(recordDef, record);
  const intervalBarStyle = {
    width: `calc((100% / ${intervals.length}) - 2px)`
  };
  const allIntervalsCompleted = intervals.every((i) => i.percentCompleted >= 1.0);
  const intervalProgressBar = !obscured && intervals.length > 0 && (
    <div
      className={clsx('record-interval-container', {
        complete: allIntervalsCompleted
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
                unlocked: unlocked && !redeemed
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
    const currentScore = _.sumBy(_.take(intervals, record.intervalsRedeemedCount), (i) => i.score);
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
      ? [intervals[Math.min(record.intervalsRedeemedCount, intervals.length - 1)].objective]
      : record.objectives;
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

  return (
    <div
      className={clsx('triumph-record', {
        redeemed: acquired,
        unlocked,
        obscured,
        tracked,
        multistep: intervals.length > 0
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
        {tracked && <img className="trackedIcon" src={trackedIcon} />}
      </div>
      {intervalProgressBar}
    </div>
  );
}

export function getRecordComponent(
  recordDef: DestinyRecordDefinition,
  profileResponse: DestinyProfileResponse
): DestinyRecordComponent | undefined {
  return recordDef.scope === DestinyScope.Character
    ? profileResponse.characterRecords.data
      ? Object.values(profileResponse.characterRecords.data)[0].records[recordDef.hash]
      : undefined
    : profileResponse.profileRecords.data
    ? profileResponse.profileRecords.data.records[recordDef.hash]
    : undefined;
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
      isRedeemed: record.intervalsRedeemedCount >= i + 1
    });

    isPrevIntervalComplete = data.complete;
    prevIntervalProgress = data.completionValue;
  }
  return intervals;
}
