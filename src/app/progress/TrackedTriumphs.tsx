import { trackedTriumphsSelector } from 'app/dim-api/selectors';
import { t } from 'app/i18next-t';
import { profileResponseSelector } from 'app/inventory/selectors';
import { useD2Definitions } from 'app/manifest/selectors';
import { RecordGrid } from 'app/records/Record';
import { searchDisplayProperties, toRecord } from 'app/records/presentation-nodes';
import { filterMap } from 'app/utils/collections';
import { compareBy } from 'app/utils/comparators';
import { DestinyPresentationNodeDefinition, DestinyRecordDefinition } from 'bungie-api-ts/destiny2';
import { useSelector } from 'react-redux';
import * as styles from './TrackedTriumphs.m.scss';

export function TrackedTriumphs({ searchQuery }: { searchQuery?: string }) {
  const defs = useD2Definitions()!;
  const profileResponse = useSelector(profileResponseSelector)!;
  const trackedTriumphs = useSelector(trackedTriumphsSelector);
  const trackedRecordHash = profileResponse?.profileRecords?.data?.trackedRecordHash || 0;

  const recordHashes = trackedRecordHash
    ? [...new Set([trackedRecordHash, ...trackedTriumphs])]
    : trackedTriumphs;
  let records = filterMap(recordHashes, (h) =>
    toRecord(defs, profileResponse, h, /* mayBeMissing */ true),
  );

  if (searchQuery) {
    records = records.filter((r) =>
      searchDisplayProperties(r.recordDef.displayProperties, searchQuery),
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
  records = records.sort(compareBy((record) => recordPath(record.recordDef).join('/')));

  if (!records.length) {
    return (
      <div className={styles.noRecords}>
        {recordHashes.length > 0 && searchQuery
          ? t('Progress.QueryFilteredTrackedTriumphs')
          : t('Progress.NoTrackedTriumph')}
      </div>
    );
  }

  return <RecordGrid records={records} redactedRecordsRevealed={true} />;
}
