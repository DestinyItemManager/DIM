import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import React from 'react';
import Collectible from './Collectible';
import Metrics from './Metrics';
import { DimPresentationNodeLeaf } from './presentation-nodes';
import Record from './Record';

/**
 * Displays "leaf node" contents for presentation nodes (collectibles, triumphs, metrics)
 */
export default function PresentationNodeLeaf({
  node,
  ownedItemHashes,
  defs,
  completedRecordsHidden,
  redactedRecordsRevealed,
}: {
  node: DimPresentationNodeLeaf;
  ownedItemHashes?: Set<number>;
  defs: D2ManifestDefinitions;
  completedRecordsHidden: boolean;
  redactedRecordsRevealed: boolean;
}) {
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
          {node.records.map((record) => (
            <Record
              key={record.recordDef.hash}
              record={record}
              defs={defs}
              completedRecordsHidden={completedRecordsHidden}
              redactedRecordsRevealed={redactedRecordsRevealed}
            />
          ))}
        </div>
      )}
      {node.metrics && node.metrics.length > 0 && <Metrics metrics={node.metrics} defs={defs} />}
    </>
  );
}
