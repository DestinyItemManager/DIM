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
    // let index = -1;
    temp.records = orderBy(
      temp.records,
      (record) => {
        /**
         * Triumph is already completed so move it to back of list
         * state is a bitmask where the ones place is for when the
         * record has been redeemed.
         */
        if (record.recordComponent.state & 1) {
          //    index++;
          //    console.log("index1: ", index, " ", -1)
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
          //     index++;
          //      console.log("index2: ", index, " ", objectives[0].progress! / objectives[0].completionValue)
          return objectives[0].progress! / objectives[0].completionValue;
        }

        /** ALGORITHM
         * try to classify each into a type?
         * Possible cases:
         *    multiple checkboxes - all completionValues are 1
         *    one progress bar with milestones
         *    checkboxes an progress bar
         *    different progress bars with no relation
         */

        let isMilestones = true;

        // This checks if there are checkboxes in the record component
        for (let i = 1; i < objectives.length; i++) {
          if (
            objectives[i - 1].completionValue === 1 ||
            objectives[i].completionValue < objectives[i - 1].completionValue
          ) {
            isMilestones = false;
            break;
          }
        }

        // its one progress bar with milestones, return the last index's progress / completionValue
        if (isMilestones) {
          //      index++;
          //      console.log("index3: ", index, " ", objectives[objectives.length - 1].progress! / objectives[objectives.length - 1].completionValue)
          return (
            objectives[objectives.length - 1].progress! /
            objectives[objectives.length - 1].completionValue
          );
        }

        // it has multiple ways of tracking progress
        let totalProgress = 0;
        for (const x of objectives) {
          // some progress bars exceed its completionValue
          if (x.complete) {
            totalProgress += 1;
            continue;
          }
          totalProgress += x.progress! / x.completionValue;
        }
        //    index++;
        //  console.log("index4: ", index, " ", totalProgress)
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
