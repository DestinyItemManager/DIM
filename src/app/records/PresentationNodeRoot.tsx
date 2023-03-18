import { createItemContextSelector } from 'app/inventory/selectors';
import { useD2Definitions } from 'app/manifest/selectors';
import { ItemFilter } from 'app/search/filter-types';
import { DestinyProfileResponse } from 'bungie-api-ts/destiny2';
import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { InventoryBuckets } from '../inventory/inventory-buckets';
import PlugSet from './PlugSet';
import { unlockedItemsForCharacterOrProfilePlugSet } from './plugset-helpers';
import { filterPresentationNodesToSearch, toPresentationNodeTree } from './presentation-nodes';
import PresentationNode from './PresentationNode';
import PresentationNodeSearchResults from './PresentationNodeSearchResults';

interface Props {
  presentationNodeHash: number;
  openedPresentationHash?: number;
  ownedItemHashes?: Set<number>;
  profileResponse: DestinyProfileResponse;
  buckets?: InventoryBuckets;
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
  const itemCreationContext = useSelector(createItemContextSelector);
  const defs = useD2Definitions()!;
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

  const nodeTree = useMemo(
    () => toPresentationNodeTree(itemCreationContext, presentationNodeHash),
    [presentationNodeHash, itemCreationContext]
  );
  // console.log(nodeTree);

  if (!nodeTree) {
    return null;
  }

  if (searchQuery && searchFilter) {
    const searchResults = filterPresentationNodesToSearch(
      nodeTree,
      searchQuery.toLowerCase(),
      searchFilter,
      Boolean(completedRecordsHidden),
      undefined,
      defs
    );

    return (
      <PresentationNodeSearchResults
        searchResults={searchResults}
        ownedItemHashes={ownedItemHashes}
        profileResponse={profileResponse}
      />
    );
  }

  const plugSetCollections = [
    // Emotes
    { hash: 2860926541, displayItem: 3960522253 },
    // Projections
    { hash: 2540258701, displayItem: 2544954628 },
  ];

  return (
    <div className="presentation-node-root">
      <PresentationNode
        node={nodeTree}
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
              plugSetCollection={plugSetCollection}
              unlockedItems={unlockedItemsForCharacterOrProfilePlugSet(
                profileResponse,
                plugSetCollection.hash,
                ''
              )}
              path={fullNodePath}
              onNodePathSelected={setNodePath}
            />
          </div>
        ))}
    </div>
  );
}
