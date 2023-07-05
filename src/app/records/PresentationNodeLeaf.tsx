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
        /**
         * Triumph is already completed so move it to back of list
         * state is a bitmask where the ones place is for when the
         * record has been redeemed.
         */
        if (record.recordComponent.state & 1) {
          return -1;
        }

        // check which key is used to track progress
        let objectives;
        if (record.recordComponent.intervalObjectives) {
          objectives = record.recordComponent.intervalObjectives;
        } else {
          objectives = record.recordComponent.objectives;
        }

        /** ALGORITHM
         * try to classify each into a type?
         * Possible cases:
         *    multiple checkboxes - all completion values are 1
         *    one progress bar with milestones
         *    one progress bar with no milestones
         *    checkboxes an progress bar
         *
         */

        // its a progress bar with no milestones
        if (objectives.length === 1) {
          return objectives[0].progress! / objectives[0].completionValue;
        }

        const hasCheckBox: bool = false;
        const isMileStoneBar: bool = false;

        let totalProgress = 0;

        for (const x of objectives) {
          if (x.complete) {
            totalProgress += 1;
          }
          totalProgress += x.progress! / x.completionValue;
        }

        return totalProgress / objectives.length;
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
