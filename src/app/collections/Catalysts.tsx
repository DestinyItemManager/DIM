import { DestinyProfileResponse, DestinyRecordState } from 'bungie-api-ts/destiny2';
import React from 'react';
import _ from 'lodash';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions';
import './collections.scss';
import { t } from 'app/i18next-t';
import CollapsibleTitle from '../dim-ui/CollapsibleTitle';
import Record from './Record';
import { CATALYSTS_ROOT_NODE } from 'app/search/d2-known-values';

export default function Catalysts({
  defs,
  profileResponse,
}: {
  defs: D2ManifestDefinitions;
  profileResponse: DestinyProfileResponse;
}) {
  const catalystPresentationNode = defs.PresentationNode.get(CATALYSTS_ROOT_NODE);
  const firstCharacterRecords = Object.values(profileResponse.characterRecords.data || {})[0]
    .records;

  const catalystRecordHashes = catalystPresentationNode.children.presentationNodes
    // flatten the 3 catalyst categories into a set of all catalyst hashes
    .flatMap((p) =>
      defs.PresentationNode.get(p.presentationNodeHash).children.records.map((r) => r.recordHash)
    )
    // filter out catalysts which aren't acquired at all, or have been completed
    .filter((h) => {
      const state = firstCharacterRecords[h] ? firstCharacterRecords[h].state : 0;
      return !(state & DestinyRecordState.Obscured) || state & DestinyRecordState.RecordRedeemed;
    });

  return (
    <CollapsibleTitle title={t('Vendors.Catalysts')} sectionId={'catalysts'}>
      <div className="records catalysts">
        {catalystRecordHashes.map((catalystRecordHash) => (
          <Record
            key={catalystRecordHash}
            recordHash={catalystRecordHash}
            defs={defs}
            profileResponse={profileResponse}
            completedRecordsHidden={true}
            redactedRecordsRevealed={true}
          />
        ))}
      </div>
    </CollapsibleTitle>
  );
}
