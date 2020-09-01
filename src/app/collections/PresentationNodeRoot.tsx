import React, { useState } from 'react';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions';
import PresentationNode from './PresentationNode';
import { DestinyProfileResponse } from 'bungie-api-ts/destiny2';
import { InventoryBuckets } from '../inventory/inventory-buckets';
import PlugSet from './PlugSet';
import _ from 'lodash';
import Record from './Record';
import { itemsForPlugSet } from './plugset-helpers';
import { TRIUMPHS_ROOT_NODE } from 'app/search/d2-known-values';
import { toPresentationNodeTree, toRecord } from './presentation-nodes';

interface Props {
  presentationNodeHash: number;
  openedPresentationHash?: number;
  ownedItemHashes?: Set<number>;
  profileResponse: DestinyProfileResponse;
  buckets?: InventoryBuckets;
  defs: D2ManifestDefinitions;

  /** Whether to show extra plugsets */
  showPlugSets?: boolean;
}

/**
 * The root for an expandable presentation node tree.
 */
export default function PresentationNodeRoot({
  presentationNodeHash,
  openedPresentationHash,
  defs,
  buckets,
  profileResponse,
  ownedItemHashes,
  showPlugSets,
}: Props) {
  const [nodePath, setNodePath] = useState<number[]>([]);

  let fullNodePath = nodePath;
  if (nodePath.length === 0 && openedPresentationHash) {
    let currentHash = openedPresentationHash;
    fullNodePath = [currentHash];
    let node = defs.PresentationNode.get(currentHash);
    while (node.parentNodeHashes.length) {
      nodePath.unshift(node.parentNodeHashes[0]);
      currentHash = node.parentNodeHashes[0];
      node = defs.PresentationNode.get(currentHash);
    }
    fullNodePath.unshift(presentationNodeHash);
  }

  if (!buckets) {
    return null;
  }

  const nodeTree = toPresentationNodeTree(defs, buckets, profileResponse, presentationNodeHash);
  if (!nodeTree) {
    return null;
  }

  const trackedRecordHash = profileResponse?.profileRecords?.data?.trackedRecordHash || undefined;
  const trackedRecord = trackedRecordHash
    ? toRecord(defs, profileResponse, trackedRecordHash)
    : null;

  const plugSetCollections = [
    // Emotes
    { hash: 1155321287, displayItem: 3960522253 },
    // Projections
    { hash: 499268600, displayItem: 2544954628 },
  ];

  return (
    <>
      {presentationNodeHash === TRIUMPHS_ROOT_NODE && trackedRecord && (
        <div className="progress-for-character">
          <div className="records">
            <Record
              record={trackedRecord}
              defs={defs}
              completedRecordsHidden={false}
              redactedRecordsRevealed={true}
            />
          </div>
        </div>
      )}

      <PresentationNode
        node={nodeTree}
        defs={defs}
        ownedItemHashes={ownedItemHashes}
        path={fullNodePath}
        onNodePathSelected={setNodePath}
        parents={[]}
      />

      {buckets &&
        showPlugSets &&
        plugSetCollections.map((plugSetCollection) => (
          <PlugSet
            key={plugSetCollection.hash}
            defs={defs}
            buckets={buckets}
            plugSetCollection={plugSetCollection}
            items={itemsForPlugSet(profileResponse, Number(plugSetCollection.hash))}
            path={fullNodePath}
            onNodePathSelected={setNodePath}
          />
        ))}
    </>
  );
}
