import { createItemContextSelector, currentStoreSelector } from 'app/inventory/selectors';
import { useD2Definitions } from 'app/manifest/selectors';
import { ItemFilter } from 'app/search/filter-types';
import { DestinyProfileResponse } from 'bungie-api-ts/destiny2';
import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import PresentationNode from './PresentationNode';
import * as styles from './PresentationNodeRoot.m.scss';
import PresentationNodeSearchResults from './PresentationNodeSearchResults';
import { makeItemsForCatalystRecords } from './catalysts';
import {
  filterPresentationNodesToSearch,
  hideCompletedRecords,
  toPresentationNodeTree,
} from './presentation-nodes';

interface Props {
  presentationNodeHash: number;
  openedPresentationHash?: number;
  ownedItemHashes?: Set<number>;
  profileResponse: DestinyProfileResponse;
  searchQuery?: string;
  isTriumphs?: boolean;
  overrideName?: string;
  completedRecordsHidden?: boolean;

  /** Whether to show extra plugsets */
  showPlugSets?: boolean;
  searchFilter?: ItemFilter;
}

const plugSetCollections = [
  // Emotes
  { hash: 2860926541, displayItem: 3960522253 },
  // Projections
  { hash: 2540258701, displayItem: 2544954628 },
];

/**
 * The root for an expandable presentation node tree.
 */
export default function PresentationNodeRoot({
  presentationNodeHash,
  openedPresentationHash,
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

  const currentStore = useSelector(currentStoreSelector);

  const unfilteredNodeTree = useMemo(
    () =>
      toPresentationNodeTree(
        itemCreationContext,
        presentationNodeHash,
        showPlugSets ? plugSetCollections : [],
        currentStore?.genderHash,
      ),
    [itemCreationContext, presentationNodeHash, showPlugSets, currentStore?.genderHash],
  );

  const nodeTree = useMemo(
    () =>
      unfilteredNodeTree && completedRecordsHidden
        ? hideCompletedRecords(unfilteredNodeTree)
        : unfilteredNodeTree,
    [completedRecordsHidden, unfilteredNodeTree],
  );

  if (!nodeTree) {
    return null;
  }

  if (searchQuery && searchFilter) {
    const catalystItemsByRecordHash = makeItemsForCatalystRecords(itemCreationContext);

    const searchResults = filterPresentationNodesToSearch(
      nodeTree,
      searchQuery.toLowerCase(),
      searchFilter,
      undefined,
      defs,
      catalystItemsByRecordHash,
    );

    return (
      <PresentationNodeSearchResults
        searchResults={searchResults}
        ownedItemHashes={ownedItemHashes}
        profileResponse={profileResponse}
      />
    );
  }

  return (
    <div className={styles.root}>
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
    </div>
  );
}
