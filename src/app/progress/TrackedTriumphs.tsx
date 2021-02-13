import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { t } from 'app/i18next-t';
import { searchDisplayProperties, toRecord } from 'app/records/presentation-nodes';
import Record from 'app/records/Record';
import { DestinyProfileResponse } from 'bungie-api-ts/destiny2';
import _ from 'lodash';
import React from 'react';
import styles from './TrackedTriumphs.m.scss';

export function TrackedTriumphs({
  trackedTriumphs,
  trackedRecordHash,
  defs,
  profileResponse,
  searchQuery,
  hideRecordIcon,
}: {
  trackedTriumphs: number[];
  trackedRecordHash: number;
  defs: D2ManifestDefinitions;
  profileResponse: DestinyProfileResponse;
  searchQuery?: string;
  hideRecordIcon?: boolean;
}) {
  const recordHashes = trackedRecordHash
    ? [...new Set([trackedRecordHash, ...trackedTriumphs])]
    : trackedTriumphs;
  let records = _.compact(recordHashes.map((h) => toRecord(defs, profileResponse, h)));

  if (searchQuery) {
    records = records.filter((r) =>
      searchDisplayProperties(r.recordDef.displayProperties, searchQuery)
    );
  }

  if (!records.length) {
    return (
      <div className={styles.noRecords}>
        {recordHashes.length > 0 && searchQuery
          ? t('Progress.QueryFilteredTrackedTriumphs')
          : t('Progress.NoTrackedTriumph')}
      </div>
    );
  }

  return (
    <div className="records">
      {records.map((record) => (
        <Record
          key={record.recordDef.hash}
          record={record}
          defs={defs}
          hideRecordIcon={hideRecordIcon}
          completedRecordsHidden={false}
          redactedRecordsRevealed={true}
        />
      ))}
    </div>
  );
}
