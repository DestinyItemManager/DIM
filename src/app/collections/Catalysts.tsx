import { CATALYSTS_ROOT_NODE } from 'app/search/d2-known-values';
import { DestinyProfileResponse, DestinyRecordState } from 'bungie-api-ts/destiny2';
import React from 'react';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions';
import './collections.scss';
import { toPresentationNodeTree } from './presentation-nodes';
import Record from './Record';

export default function Catalysts({
  defs,
  profileResponse,
}: {
  defs: D2ManifestDefinitions;
  profileResponse: DestinyProfileResponse;
}) {
  const catalystsNode = toPresentationNodeTree(
    defs,
    undefined,
    profileResponse,
    CATALYSTS_ROOT_NODE
  );
  if (!catalystsNode || !catalystsNode.childPresentationNodes) {
    return null;
  }

  const records = catalystsNode.childPresentationNodes
    .flatMap((c) => c.records!)
    // filter out catalysts which aren't acquired at all, or have been completed
    .filter(
      (r) =>
        !(r.recordComponent.state & DestinyRecordState.Obscured) ||
        r.recordComponent.state & DestinyRecordState.RecordRedeemed
    );

  return (
    <div className="records catalysts">
      {records.map((record) => (
        <Record
          key={record.recordDef.hash}
          record={record}
          defs={defs}
          completedRecordsHidden={true}
          redactedRecordsRevealed={true}
        />
      ))}
    </div>
  );
}
