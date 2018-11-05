import * as React from 'react';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions.service';
import {
  DestinyProfileResponse,
  DestinyScope,
  DestinyCollectibleState,
  DestinyRecordDefinition,
  DestinyRecordState
} from 'bungie-api-ts/destiny2';
import classNames from 'classnames';
import './Collectible.scss';

interface Props {
  recordHash: number;
  defs: D2ManifestDefinitions;
  profileResponse: DestinyProfileResponse;
  // TODO: choose character
  // TODO: ratings - including loading in a section at a time!
  // rating probably need to be in indexeddb
}

export default class Record extends React.Component<Props> {
  render() {
    const { recordHash, defs, profileResponse } = this.props;
    const recordDef = defs.Record.get(recordHash);
    const state = getRecordState(recordDef, profileResponse);

    if (state & DestinyCollectibleState.Invisible) {
      return null;
    }

    const acquired = !Boolean(state & DestinyRecordState.RecordRedeemed);

    return (
      <div
        className={classNames('vendor-item', {
          unavailable: !acquired
        })}
      >
        {recordDef.displayProperties.name}
      </div>
    );
  }
}

export function getRecordState(
  recordDef: DestinyRecordDefinition,
  profileResponse: DestinyProfileResponse
): DestinyRecordState {
  return recordDef.scope === DestinyScope.Character
    ? Object.values(profileResponse.characterRecords.data)[0].records[recordDef.hash].state
    : profileResponse.profileRecords.data.records[recordDef.hash].state;
}
