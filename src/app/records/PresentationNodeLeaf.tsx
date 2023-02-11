import Collectible from './Collectible';
import Craftable from './Craftable';
import Metrics from './Metrics';
import { DimPresentationNodeLeaf } from './presentation-nodes';
import Record from './Record';

/**
 * Displays "leaf node" contents for presentation nodes (collectibles, triumphs, metrics)
 */
export default function PresentationNodeLeaf({
  node,
  ownedItemHashes,
  completedRecordsHidden,
  redactedRecordsRevealed,
  unobtainableRecordsHidden,
  isParentLegacy,
}: {
  node: DimPresentationNodeLeaf;
  ownedItemHashes?: Set<number>;
  completedRecordsHidden: boolean;
  redactedRecordsRevealed: boolean;
  unobtainableRecordsHidden: boolean;
  isParentLegacy?: boolean;
}) {
  const seenRecords = new Set<number>();

  return (
    <>
      {node.collectibles && node.collectibles.length > 0 && (
        <div className="collectibles">
          {node.collectibles.map((collectible) => (
            <Collectible
              key={collectible.collectibleDef.hash}
              collectible={collectible}
              owned={Boolean(ownedItemHashes?.has(collectible.collectibleDef.itemHash))}
            />
          ))}
        </div>
      )}

      {node.records && node.records.length > 0 && (
        <div className="records">
          {node.records.map((record) => {
            if (seenRecords.has(record.recordDef.hash)) {
              return null;
            }
            seenRecords.add(record.recordDef.hash);
            return (
              <Record
                key={record.recordDef.hash}
                record={record}
                completedRecordsHidden={completedRecordsHidden}
                redactedRecordsRevealed={redactedRecordsRevealed}
                unobtainableRecordsHidden={unobtainableRecordsHidden}
                isParentLegacy={isParentLegacy}
              />
            );
          })}
        </div>
      )}

      {node.metrics && node.metrics.length > 0 && <Metrics metrics={node.metrics} />}

      {node.craftables && node.craftables.length > 0 && (
        <div className="collectibles">
          {node.craftables.map((craftable) => (
            <Craftable key={craftable.item.hash} craftable={craftable} />
          ))}
        </div>
      )}
    </>
  );
}
