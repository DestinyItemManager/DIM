import { DestinyProfileResponse, DestinyRecordState } from 'bungie-api-ts/destiny2';
import React from 'react';
import _ from 'lodash';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions.service';
import './collections.scss';
import { t } from 'app/i18next-t';
import CollapsibleTitle from '../dim-ui/CollapsibleTitle';
import Record from './Record';

export default function Catalysts({
  defs,
  profileResponse
}: {
  defs: D2ManifestDefinitions;
  profileResponse: DestinyProfileResponse;
}) {
  const catalystPresentationNode = defs.PresentationNode.get(1111248994);
  const firstCharacterRecords = Object.values(profileResponse.characterRecords.data || {})[0]
    .records;

  const catalystRecordHashes = catalystPresentationNode.children.presentationNodes
    // flatten the 3 catalyst categories into a set of all catalyst hashes
    .flatMap((p) =>
      defs.PresentationNode.get(p.presentationNodeHash).children.records.map((r) => r.recordHash)
    )
    // filter out catalysts which aren't acquired at all, or have been completed
    .filter(
      (h) =>
        !(firstCharacterRecords[h].state & DestinyRecordState.Obscured) ||
        firstCharacterRecords[h].state & DestinyRecordState.RecordRedeemed
    );

  return (
    <>
      <CollapsibleTitle title={t('Vendors.Catalysts')} sectionId={'catalysts'}>
        <div className="collectionItems">
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
    </>
  );
}
