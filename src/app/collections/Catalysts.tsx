import { DestinyRecordState, DestinyProfileResponse } from 'bungie-api-ts/destiny2';
import React from 'react';
import _ from 'lodash';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions';
import './collections.scss';
import { t } from 'app/i18next-t';
import CollapsibleTitle from '../dim-ui/CollapsibleTitle';
import Record from './Record';
import { CATALYSTS_ROOT_NODE } from 'app/search/d2-known-values';
import { toPresentationNodeTree } from './presentation-nodes';

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
    <CollapsibleTitle title={t('Vendors.Catalysts')} sectionId={'catalysts'}>
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
    </CollapsibleTitle>
  );
}
