import { trackedTriumphsSelector } from 'app/dim-api/selectors';
import { t } from 'app/i18next-t';
import { profileResponseSelector } from 'app/inventory-stores/selectors';
import { useD2Definitions } from 'app/manifest/selectors';
import { searchDisplayProperties, toRecord } from 'app/records/presentation-nodes';
import Record from 'app/records/Record';
import { DestinyPresentationNodeDefinition, DestinyRecordDefinition } from 'bungie-api-ts/destiny2';
import _ from 'lodash';
import React from 'react';
import { useSelector } from 'react-redux';
import styles from './TrackedTriumphs.m.scss';

export function TrackedTriumphs({
  searchQuery,
  hideRecordIcon,
}: {
  searchQuery?: string;
  hideRecordIcon?: boolean;
}) {
  const defs = useD2Definitions()!;
  const profileResponse = useSelector(profileResponseSelector)!;
  const trackedTriumphs = useSelector(trackedTriumphsSelector);
  const trackedRecordHash = profileResponse?.profileRecords?.data?.trackedRecordHash || 0;

  const recordHashes = trackedRecordHash
    ? [...new Set([trackedRecordHash, ...trackedTriumphs])]
    : trackedTriumphs;
  let records = _.compact(recordHashes.map((h) => toRecord(defs, profileResponse, h)));

  if (searchQuery) {
    records = records.filter((r) =>
      searchDisplayProperties(r.recordDef.displayProperties, searchQuery)
    );
  }

  // determine absolute path of record for sorting purpose
  const recordPath = (r: DestinyRecordDefinition) => {
    const path: string[] = [];
    let parent: DestinyRecordDefinition | DestinyPresentationNodeDefinition = r;

    while (parent?.parentNodeHashes?.length > 0) {
      path.unshift(parent.displayProperties.name);
      parent = defs.PresentationNode.get(parent.parentNodeHashes[0]);
    }
    return path;
  };

  // sort by parent node groups (alphabetically)
  records = _.sortBy(records, (record) => recordPath(record.recordDef).join('/'));

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
          hideRecordIcon={hideRecordIcon}
          completedRecordsHidden={false}
          redactedRecordsRevealed={true}
        />
      ))}
    </div>
  );
}
