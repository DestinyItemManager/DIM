import { compareBy } from 'app/utils/comparators';
import { VendorItemDisplay } from 'app/vendors/VendorItemComponent';
import { DestinyCollectibleState, DestinyRecordState } from 'bungie-api-ts/destiny2';
import Collectible from './Collectible';
import CollectiblesGrid from './CollectiblesGrid';
import Craftable from './Craftable';
import Metrics from './Metrics';
import { RecordGrid } from './Record';
import {
  DimCollectible,
  DimMetric,
  DimPresentationNodeLeaf,
  DimRecord,
} from './presentation-nodes';

/**
 * Displays "leaf node" contents for presentation nodes (collectibles, triumphs, metrics)
 */
export default function PresentationNodeLeaf({
  node,
  ownedItemHashes,
  redactedRecordsRevealed,
  sortRecordProgression,
}: {
  node: DimPresentationNodeLeaf;
  ownedItemHashes?: Set<number>;
  redactedRecordsRevealed: boolean;
  sortRecordProgression: boolean;
}) {
  return (
    <>
      {node.collectibles && node.collectibles.length > 0 && (
        <CollectiblesGrid>
          {(sortRecordProgression ? sortCollectibles(node.collectibles) : node.collectibles).map(
            (collectible) => (
              <Collectible
                key={collectible.key}
                collectible={collectible}
                owned={Boolean(ownedItemHashes?.has(collectible.item.hash))}
              />
            ),
          )}
        </CollectiblesGrid>
      )}

      {node.records && node.records.length > 0 && (
        <RecordGrid
          records={sortRecordProgression ? sortRecords(node.records) : node.records}
          redactedRecordsRevealed={redactedRecordsRevealed}
        />
      )}

      {node.metrics && node.metrics.length > 0 && (
        <Metrics metrics={sortRecordProgression ? sortMetrics(node.metrics) : node.metrics} />
      )}

      {node.craftables && node.craftables.length > 0 && (
        <CollectiblesGrid>
          {node.craftables.map((craftable) => (
            <Craftable key={craftable.item.hash} craftable={craftable} />
          ))}
        </CollectiblesGrid>
      )}

      {node.plugs && node.plugs.length > 0 && (
        <CollectiblesGrid>
          {node.plugs.map(({ item, unlocked }) => (
            <VendorItemDisplay key={item.index} item={item} unavailable={!unlocked} owned={false} />
          ))}
        </CollectiblesGrid>
      )}
    </>
  );
}

function sortRecords(records: DimRecord[]): DimRecord[] {
  return records.toSorted(
    compareBy((record) => {
      //  Triumph is already completed so move it to back of list.
      if (
        record.recordComponent.state & DestinyRecordState.RecordRedeemed ||
        record.recordComponent.state & DestinyRecordState.CanEquipTitle ||
        !record.recordComponent.state
      ) {
        return 1;
      }

      // check which key is used to track progress
      let objectives;
      if (record.recordComponent.intervalObjectives) {
        objectives = record.recordComponent.intervalObjectives;
      } else if (record.recordComponent.objectives) {
        objectives = record.recordComponent.objectives;
      } else {
        // its a legacy triumph so it has no objectives and is not completed
        return 0;
      }

      //  Sum up the progress
      let totalProgress = 0;
      for (const x of objectives) {
        totalProgress += Math.min(1, x.progress! / x.completionValue);
      }
      return -(totalProgress / objectives.length);
    }),
  );
}

function sortCollectibles(collectibles: DimCollectible[]): DimCollectible[] {
  return collectibles.toSorted(
    compareBy((collectible) => {
      if (collectible.state & DestinyCollectibleState.NotAcquired) {
        return -1;
      }
      return 0;
    }),
  );
}

function sortMetrics(metrics: DimMetric[]): DimMetric[] {
  return metrics.toSorted(
    compareBy((metric) => {
      const objectives = metric.metricComponent.objectiveProgress;
      if (objectives.complete) {
        return 1;
      }
      return -(objectives.progress! / objectives.completionValue);
    }),
  );
}
