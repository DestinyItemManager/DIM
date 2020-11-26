import { ItemFilter } from 'app/search/filter-types';
import { DestinyProfileResponse } from 'bungie-api-ts/destiny2';
import React, { useState } from 'react';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions';
import { InventoryBuckets } from '../inventory/inventory-buckets';
import PlugSet from './PlugSet';
import { itemsForPlugSet } from './plugset-helpers';
import { filterPresentationNodesToSearch, toPresentationNodeTree } from './presentation-nodes';
import PresentationNode from './PresentationNode';
import PresentationNodeSearchResults from './PresentationNodeSearchResults';

interface Props {
  presentationNodeHash: number;
  openedPresentationHash?: number;
  ownedItemHashes?: Set<number>;
  profileResponse: DestinyProfileResponse;
  buckets?: InventoryBuckets;
  defs: D2ManifestDefinitions;
  searchQuery?: string;
  isTriumphs?: boolean;
  overrideName?: string;
  completedRecordsHidden?: boolean;

  /** Whether to show extra plugsets */
  showPlugSets?: boolean;
  searchFilter?: ItemFilter;
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
  searchQuery,
  searchFilter,
  isTriumphs,
  overrideName,
  completedRecordsHidden,
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

  const nodeTree = toPresentationNodeTree(defs, buckets, profileResponse, presentationNodeHash);
  if (!nodeTree) {
    return null;
  }

  if (searchQuery && searchFilter) {
    const searchResults = filterPresentationNodesToSearch(
      nodeTree,
      searchQuery.toLowerCase(),
      searchFilter,
      Boolean(completedRecordsHidden)
    );

    return (
      <PresentationNodeSearchResults
        searchResults={searchResults}
        defs={defs}
        ownedItemHashes={ownedItemHashes}
        profileResponse={profileResponse}
      />
    );
  }

  const plugSetCollections = [
    // Emotes
    { hash: 1155321287, displayItem: 3960522253 },
    // Projections
    { hash: 499268600, displayItem: 2544954628 },
  ];

  return (
    <div className="presentation-node-root">
      <PresentationNode
        node={nodeTree}
        defs={defs}
        ownedItemHashes={ownedItemHashes}
        path={fullNodePath}
        onNodePathSelected={setNodePath}
        parents={[]}
        isRootNode={true}
        isInTriumphs={isTriumphs}
        overrideName={overrideName}
      />

      {buckets &&
        showPlugSets &&
        plugSetCollections.map((plugSetCollection) => (
          <div key={plugSetCollection.hash} className="presentation-node">
            <PlugSet
              defs={defs}
              buckets={buckets}
              plugSetCollection={plugSetCollection}
              items={itemsForPlugSet(profileResponse, Number(plugSetCollection.hash))}
              path={fullNodePath}
              onNodePathSelected={setNodePath}
            />
          </div>
        ))}
    </div>
  );
}
