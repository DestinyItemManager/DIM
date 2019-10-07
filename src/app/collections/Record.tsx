import React from 'react';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions';
import {
  DestinyProfileResponse,
  DestinyScope,
  DestinyRecordDefinition,
  DestinyRecordState,
  DestinyRecordComponent,
  DestinyUnlockValueUIStyle
} from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import './Record.scss';
import Objective from '../progress/Objective';
import BungieImage from '../dim-ui/BungieImage';
import { t } from 'app/i18next-t';
import ishtarIcon from '../../images/ishtar-collective.svg';
import ExternalLink from '../dim-ui/ExternalLink';
import idx from 'idx';
import trackedIcon from 'images/trackedIcon.svg';
import catalystIcons from 'data/d2/catalyst-triumph-icons.json';

interface Props {
  recordHash: number;
  defs: D2ManifestDefinitions;
  profileResponse: DestinyProfileResponse;
  completedRecordsHidden: boolean;
  redactedRecordsRevealed: boolean;
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
  const tracked =
    idx(profileResponse, (p) => p.profileRecords.data.trackedRecordHash) === recordHash;
  const loreLink =
    !obscured &&
    recordDef.loreHash &&
    `http://www.ishtar-collective.net/entries/${recordDef.loreHash}`;
  const showObjectives =
    record.objectives &&
    ((!obscured && record.objectives.length > 1) ||
      (record.objectives.length === 1 &&
        !(
          defs.Objective.get(record.objectives[0].objectiveHash).valueStyle ===
            DestinyUnlockValueUIStyle.Checkbox ||
          (record.objectives[0].completionValue === 1 &&
            !defs.Objective.get(record.objectives[0].objectiveHash).allowOvercompletion)
        )));

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

  return (
    <div
      className={clsx('triumph-record', {
        redeemed: acquired,
        unlocked,
        obscured,
        tracked
      })}
    >
      {recordIcon && <BungieImage className="record-icon" src={recordIcon} />}
      <div className="record-info">
        {!obscured && recordDef.completionInfo && (
          <div className="record-value">
            {t('Progress.RecordValue', { value: recordDef.completionInfo.ScoreValue })}
          </div>
        )}
        <h3>{name}</h3>
        {description && description.length > 0 && <p>{description}</p>}
        {showObjectives && (
          <div className="record-objectives">
            {record.objectives.map((objective) => (
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
