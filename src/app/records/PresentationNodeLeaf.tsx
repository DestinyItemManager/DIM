import { DestinyCollectibleState, DestinyRecordState } from 'bungie-api-ts/destiny2';
import { sortBy } from 'lodash';
import Collectible from './Collectible';
import CollectiblesGrid from './CollectiblesGrid';
import Craftable from './Craftable';
import Metrics from './Metrics';
import { RecordGrid } from './Record';
import { DimPresentationNodeLeaf } from './presentation-nodes';

/**
 * Displays "leaf node" contents for presentation nodes (collectibles, triumphs, metrics)
 */
export default function PresentationNodeLeaf({
  node,
  ownedItemHashes,
  completedRecordsHidden,
  redactedRecordsRevealed,
  sortRecordProgression,
}: {
  node: DimPresentationNodeLeaf;
  ownedItemHashes?: Set<number>;
  completedRecordsHidden: boolean;
  redactedRecordsRevealed: boolean;
  sortRecordProgression: boolean;
}) {
  if (sortRecordProgression && (node.records || node.collectibles || node.metrics)) {
    node = sortRecords(node);
  }

  return (
    <>
      {node.collectibles && node.collectibles.length > 0 && (
        <CollectiblesGrid>
          {node.collectibles.map((collectible) => (
            <Collectible
              key={collectible.key}
              collectible={collectible}
              owned={Boolean(ownedItemHashes?.has(collectible.item.hash))}
            />
          ))}
        </CollectiblesGrid>
      )}

      {node.records && node.records.length > 0 && (
        <RecordGrid
          records={node.records}
          completedRecordsHidden={completedRecordsHidden}
          redactedRecordsRevealed={redactedRecordsRevealed}
        />
      )}

      {node.metrics && node.metrics.length > 0 && <Metrics metrics={node.metrics} />}

      {node.craftables && node.craftables.length > 0 && (
        <CollectiblesGrid>
          {node.craftables.map((craftable) => (
            <Craftable key={craftable.item.hash} craftable={craftable} />
          ))}
        </CollectiblesGrid>
      )}
    </>
  );
}

function sortRecords(node: DimPresentationNodeLeaf) {
  const sortedNode = { ...node };
  // RECORDS
  if (sortedNode.records) {
    sortedNode.records = sortBy(sortedNode.records, (record) => {
      //  Triumph is already completed so move it to back of list.
      //  State is a bitmask where the ones place is for when the
      //  record has been redeemed. The other checks move completed
      //  but not redeemed to the back.
      if (
        record.recordComponent.state & DestinyRecordState.RecordRedeemed ||
        record.recordComponent.state & DestinyRecordState.CanEquipTitle ||
        !record.recordComponent.state
      ) {
        return 999;
      }

      // check which key is used to track progress
      let objectives;
      if (record.recordComponent.intervalObjectives) {
        objectives = record.recordComponent.intervalObjectives;
      } else if (record.recordComponent.objectives) {
        objectives = record.recordComponent.objectives;
      } else {
        // its a legacy triumph so it has no objectives
        return 999;
      }

      //  Iterate through the objectives array and return the average
      //  of its % progress.
      //
      let totalProgress = 0;
      for (const x of objectives) {
        // some progress bars exceed its completionValue
        if (x.complete) {
          totalProgress += 1;
          continue;
        }
        totalProgress += x.progress! / x.completionValue;
      }
      return -totalProgress / objectives.length;
    });
    // COLLECTIBLES
  } else if (sortedNode.collectibles) {
    //  Only need to push owned items to the back of the list
    sortedNode.collectibles = sortBy(sortedNode.collectibles, (collectible) => {
      if (collectible.state & DestinyCollectibleState.NotAcquired) {
        return 0;
      }
      return 1;
    });
    // METRICS
  } else if (sortedNode.metrics) {
    sortedNode.metrics = sortBy(sortedNode.metrics, (metric) => {
      const objectives = metric.metricComponent.objectiveProgress;
      if (objectives.complete) {
        return 999;
      }
      return objectives.progress! / objectives.completionValue;
    });
  }
  return sortedNode;
}
