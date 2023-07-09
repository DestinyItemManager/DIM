import { DestinyCollectibleState, DestinyRecordState } from 'bungie-api-ts/destiny2';
import { orderBy } from 'lodash';
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
  const newNode = { ...node };
  if (sortRecordProgression) {
    /**
     * RECORDS
     */
    if (node.records) {
      newNode.records = orderBy(
        newNode.records,
        (record) => {
          /**
           * Triumph is already completed so move it to back of list.
           * State is a bitmask where the ones place is for when the
           * record has been redeemed. The other checks move completed
           * but not redeemed to the back.
           */
          if (
            record.recordComponent.state & DestinyRecordState.RecordRedeemed ||
            record.recordComponent.state & DestinyRecordState.CanEquipTitle ||
            !record.recordComponent.state
          ) {
            return -1;
          }

          // check which key is used to track progress
          let objectives;
          if (record.recordComponent.intervalObjectives) {
            objectives = record.recordComponent.intervalObjectives;
          } else if (record.recordComponent.objectives) {
            objectives = record.recordComponent.objectives;
          } else {
            // its a legacy triumph so it has no objectives
            return 0;
          }

          /**
           * Iterate through the objectives array and return the average
           * of its % progress.
           */
          let totalProgress = 0;
          for (const x of objectives) {
            // some progress bars exceed its completionValue
            if (x.complete) {
              totalProgress += 1;
              continue;
            }
            totalProgress += x.progress! / x.completionValue;
          }
          return totalProgress / objectives.length;
        },
        ['desc']
      );
      /**
       * COLLECTIBLES
       */
    } else if (node.collectibles) {
      //  Only need to push owned items to the back of the list
      newNode.collectibles = orderBy(
        newNode.collectibles,
        (collectible) => {
          if (collectible.state & DestinyCollectibleState.NotAcquired) {
            return 0;
          }
          return -1;
        },
        ['desc']
      );
      /**
       * METRICS
       */
    } else if (node.metrics) {
      newNode.metrics = orderBy(
        newNode.metrics,
        (metric) => {
          const objectives = metric.metricComponent.objectiveProgress;
          if (objectives.complete) {
            return -1;
          }
          return objectives.progress! / objectives.completionValue;
        },
        ['desc']
      );
    }
  }

  return (
    <>
      {newNode.collectibles && newNode.collectibles.length > 0 && (
        <CollectiblesGrid>
          {newNode.collectibles.map((collectible) => (
            <Collectible
              key={collectible.collectibleDef.hash}
              collectible={collectible}
              owned={Boolean(ownedItemHashes?.has(collectible.collectibleDef.itemHash))}
            />
          ))}
        </CollectiblesGrid>
      )}

      {newNode.records && newNode.records.length > 0 && (
        <RecordGrid
          records={newNode.records}
          completedRecordsHidden={completedRecordsHidden}
          redactedRecordsRevealed={redactedRecordsRevealed}
        />
      )}

      {newNode.metrics && newNode.metrics.length > 0 && <Metrics metrics={newNode.metrics} />}

      {newNode.craftables && newNode.craftables.length > 0 && (
        <CollectiblesGrid>
          {newNode.craftables.map((craftable) => (
            <Craftable key={craftable.item.hash} craftable={craftable} />
          ))}
        </CollectiblesGrid>
      )}
    </>
  );
}
