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
  if (node.records) {
    console.log('before', node.records);
    const temp = { ...node };
    temp.records = orderBy(
      temp.records,
      (record) => {
        let numerator;
        let denominator;
        let objectives;

        // check if which key is used to track progress
        if (record.recordComponent.intervalObjectives) {
          objectives = record.recordComponent.intervalObjectives;
        } else {
          objectives = record.recordComponent.objectives;
        }

        // triumph is already completed
        if (objectives[objectives.length - 1].complete) {
          return -1;
        }

        // check if the progress is divided into milestones
        if (objectives.length > 1) {
          // progress is not checked with check boxes
          if (objectives[objectives.length - 1].completionValue !== 1) {
            numerator = objectives[objectives.length - 1].progress;
            denominator = objectives[objectives.length - 1].completionValue;
          } else {
            numerator = 0;
            denominator = objectives.length;
            for (const i of objectives) {
              if (i.complete) {
                numerator += 1;
              }
            }
          }
        } else {
          numerator = objectives[0].progress!;
          denominator = objectives[0].completionValue;
        }

        /**
         * Check is done this way since some objective progress can exceed
         * completion value
         */
        if (objectives.length === 1 && objectives[0].complete) {
          return -1;
        }

        return numerator! / denominator;
      },
      ['desc']
    );
    console.log('after', temp.records);
    console.log('*************************');

    node.records = temp.records;
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
