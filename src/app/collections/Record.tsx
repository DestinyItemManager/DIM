import * as React from 'react';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions.service';
import {
  DestinyProfileResponse,
  DestinyScope,
  DestinyRecordDefinition,
  DestinyRecordState,
  DestinyRecordComponent,
  DestinyUnlockValueUIStyle
} from 'bungie-api-ts/destiny2';
import classNames from 'classnames';
import './Record.scss';
import Objective from '../progress/Objective';
import BungieImage from '../dim-ui/BungieImage';
import { t } from 'i18next';
import ishtarIcon from '../../images/ishtar-collective.svg';
import ExternalLink from '../dim-ui/ExternalLink';

interface Props {
  recordHash: number;
  defs: D2ManifestDefinitions;
  profileResponse: DestinyProfileResponse;
}

export default class Record extends React.Component<Props> {
  render() {
    const { recordHash, defs, profileResponse } = this.props;
    const recordDef = defs.Record.get(recordHash);
    if (!recordDef) {
      return null;
    }
    const record = getRecordComponent(recordDef, profileResponse);

    if (record.state & DestinyRecordState.Invisible || recordDef.redacted) {
      return null;
    }

    const acquired = Boolean(record.state & DestinyRecordState.RecordRedeemed);
    const unlocked = !acquired && !Boolean(record.state & DestinyRecordState.ObjectiveNotCompleted);
    const obscured = !unlocked && !acquired && Boolean(record.state & DestinyRecordState.Obscured);
    const loreLink =
      !obscured &&
      recordDef.loreHash &&
      `http://www.ishtar-collective.net/entries/${recordDef.loreHash}`;
    const showObjectives =
      (!obscured && record.objectives.length > 1) ||
      (record.objectives.length === 1 &&
        !(
          defs.Objective.get(record.objectives[0].objectiveHash).valueStyle ===
            DestinyUnlockValueUIStyle.Checkbox ||
          (record.objectives[0].completionValue === 1 &&
            !defs.Objective.get(record.objectives[0].objectiveHash).allowOvercompletion)
        ));

    const name = obscured ? t('Progress.SecretTriumph') : recordDef.displayProperties.name;
    const description = obscured
      ? recordDef.stateInfo.obscuredString
      : recordDef.displayProperties.description;

    return (
      <div
        className={classNames('triumph-record', {
          redeemed: acquired,
          unlocked,
          obscured
        })}
      >
        {recordDef.displayProperties.icon && (
          <BungieImage className="record-icon" src={recordDef.displayProperties.icon} />
        )}
        <div className="record-info">
          {!obscured && recordDef.completionInfo && (
            <div className="record-value">
              {t('Progress.RecordValue', { value: recordDef.completionInfo.ScoreValue })}
            </div>
          )}
          <h3>{name}</h3>
          {description.length > 0 && <p>{description}</p>}
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
        </div>
      </div>
    );
  }
}

export function getRecordComponent(
  recordDef: DestinyRecordDefinition,
  profileResponse: DestinyProfileResponse
): DestinyRecordComponent {
  return recordDef.scope === DestinyScope.Character
    ? Object.values(profileResponse.characterRecords.data)[0].records[recordDef.hash]
    : profileResponse.profileRecords.data.records[recordDef.hash];
}
