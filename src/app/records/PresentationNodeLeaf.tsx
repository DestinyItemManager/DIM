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
}: {
  node: DimPresentationNodeLeaf;
  ownedItemHashes?: Set<number>;
  completedRecordsHidden: boolean;
  redactedRecordsRevealed: boolean;
}) {
  if (node) {
    const sortedTriumphs = { ...node };
    if (node.records) {
      sortedTriumphs.records = orderBy(
        sortedTriumphs.records,
        (record) => {
          /**
           * Triumph is already completed so move it to back of list
           * state is a bitmask where the ones place is for when the
           * record has been redeemed.
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
          } else {
            objectives = record.recordComponent.objectives;
          }

          // its a progress bar with no milestones
          if (objectives.length === 1) {
            return objectives[0].progress! / objectives[0].completionValue;
          }

          /**
           * Iterate through the objectives array and return the average
           * of its % progress
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
      node.records = sortedTriumphs.records;
    } else if (node.collectibles) {
      sortedTriumphs.collectibles = orderBy(
        sortedTriumphs.collectibles,
        (collectible) => {
          if (collectible.state & DestinyCollectibleState.NotAcquired) {
            return 1;
          }
          return 0;
        },
        ['desc']
      );
      node.collectibles = sortedTriumphs.collectibles;
    } else if (node.metrics) {
      // console.log(node)
      sortedTriumphs.metrics = orderBy(
        sortedTriumphs.metrics,
        (metric) => {
          const objectives = metric.metricComponent.objectiveProgress;
          if (objectives.complete) {
            // console.log(-1)
            return -1;
          }
          // console.log(objectives.progress! / objectives.completionValue)
          return objectives.progress! / objectives.completionValue;
        },
        ['desc']
      );
      node.metrics = sortedTriumphs.metrics;
    }
  }
  //  console.log('after', node);
  //  console.log('*************************');

  return (
    <>
      {node.collectibles && node.collectibles.length > 0 && (
        <CollectiblesGrid>
          {node.collectibles.map((collectible) => (
            <Collectible
              key={collectible.collectibleDef.hash}
              collectible={collectible}
              owned={Boolean(ownedItemHashes?.has(collectible.collectibleDef.itemHash))}
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
