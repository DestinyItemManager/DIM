import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { DimItem } from 'app/inventory/item-types';
import { ItemCreationContext, makeFakeItem } from 'app/inventory/store/d2-item-factory';
import { ItemFilter } from 'app/search/filter-types';
import { count, filterMap } from 'app/utils/collections';
import extraItemCollectibles from 'data/d2/unreferenced-collections-items.json';

import { DimTitle } from 'app/inventory/store-types';
import { getTitleInfo } from 'app/inventory/store/d2-store-factory';
import {
  DestinyCollectibleDefinition,
  DestinyCollectibleState,
  DestinyCraftableComponent,
  DestinyDisplayPropertiesDefinition,
  DestinyMetricComponent,
  DestinyMetricDefinition,
  DestinyPresentationNodeCollectibleChildEntry,
  DestinyPresentationNodeComponent,
  DestinyPresentationNodeCraftableChildEntry,
  DestinyPresentationNodeDefinition,
  DestinyPresentationNodeMetricChildEntry,
  DestinyPresentationNodeRecordChildEntry,
  DestinyPresentationNodeState,
  DestinyProfileResponse,
  DestinyRecordComponent,
  DestinyRecordDefinition,
  DestinyRecordState,
  DestinyScope,
} from 'bungie-api-ts/destiny2';
import _ from 'lodash';
import { unlockedItemsForCharacterOrProfilePlugSet } from './plugset-helpers';

export interface DimPresentationNodeLeaf {
  records?: DimRecord[];
  collectibles?: DimCollectible[];
  metrics?: DimMetric[];
  craftables?: DimCraftable[];
  plugs?: DimCollectiblePlug[];
}

export interface DimPresentationNode extends DimPresentationNodeLeaf {
  /**
   * The node definition may be missing if it's one of the fake nodes for PlugSets.
   * The required properties `hash`, `name` and `icon` are derived from the def
   * or generated with fake info.
   */
  nodeDef: DestinyPresentationNodeDefinition | undefined;
  nodeComponent: DestinyPresentationNodeComponent | undefined;
  /** May or may not be an actual hash */
  hash: number;
  name: string;
  icon: string;
  visible: number;
  acquired: number;
  childPresentationNodes?: DimPresentationNode[];
  /**
   * For seals, the title info.
   */
  titleInfo?: DimTitle;
}

export interface DimRecord {
  recordComponent: DestinyRecordComponent;
  recordDef: DestinyRecordDefinition;
  trackedInGame: boolean;
}

export interface DimMetric {
  metricComponent: DestinyMetricComponent;
  metricDef: DestinyMetricDefinition;
}

export interface DimCollectible {
  state: DestinyCollectibleState;
  collectibleDef: DestinyCollectibleDefinition;
  item: DimItem;
  key: string;
  /**
   * true if this was artificially created by DIM.
   * some items are missing in collectibles, and we can fix that,
   * but they shouldn't be counted toward completion meters
   * or they'll seem wrong compared to in-game collections
   */
  fake: boolean;
}

export interface DimCraftable {
  // to-do: determine what interesting information we can share about a craftable
  item: DimItem;
  canCraftThis: boolean;
  canCraftAllPlugs: boolean;
}

export interface DimCollectiblePlug {
  item: DimItem;
  unlocked: boolean;
}

export interface DimPresentationNodeSearchResult extends DimPresentationNodeLeaf {
  /** The sequence of nodes from outside to inside ending in the leaf node that contains our matching records/collectibles/metrics */
  path: DimPresentationNode[];
}

/** Process the live data into DIM types that collect everything in one place and can be filtered/searched. */
export function toPresentationNodeTree(
  itemCreationContext: ItemCreationContext,
  node: number,
  plugSetCollections?: { hash: number; displayItem: number }[],
  genderHash?: number,
): DimPresentationNode | null {
  const { defs, buckets, profileResponse } = itemCreationContext;
  const presentationNodeDef = defs.PresentationNode.get(node);
  if (presentationNodeDef.redacted) {
    return null;
  }

  const nodeComponent =
    profileResponse.profilePresentationNodes?.data?.nodes[presentationNodeDef.hash];

  if ((nodeComponent?.state ?? 0) & DestinyPresentationNodeState.Invisible) {
    return null;
  }

  // For titles, display the title, completion and gilding count
  const titleInfo =
    presentationNodeDef.completionRecordHash && genderHash
      ? getTitleInfo(
          presentationNodeDef.completionRecordHash,
          defs,
          profileResponse.profileRecords.data,
          genderHash,
        )
      : undefined;

  const commonNodeProperties = {
    nodeDef: presentationNodeDef,
    hash: presentationNodeDef.hash,
    name: titleInfo?.title || presentationNodeDef.displayProperties.name,
    icon: presentationNodeDef.displayProperties.icon,
    titleInfo,
    nodeComponent,
  };
  if (presentationNodeDef.children.collectibles?.length) {
    const collectibles = toCollectibles(
      itemCreationContext,
      presentationNodeDef.children.collectibles,
    );
    const visible = collectibles.filter((c) => !c.fake).length;
    const acquired = count(
      collectibles,
      (c) => !c.fake && !(c.state & DestinyCollectibleState.NotAcquired),
    );

    // add an entry for self and return
    return {
      ...commonNodeProperties,
      visible,
      acquired,
      collectibles,
    };
  } else if (presentationNodeDef.children.records?.length) {
    const records = toRecords(defs, profileResponse, presentationNodeDef.children.records);
    const visible = records.length;
    const acquired = count(records, (r) =>
      Boolean(r.recordComponent.state & DestinyRecordState.RecordRedeemed),
    );

    // add an entry for self and return
    return {
      ...commonNodeProperties,
      visible,
      acquired,
      records,
    };
  } else if (buckets && presentationNodeDef.children.craftables?.length) {
    const craftables = toCraftables(itemCreationContext, presentationNodeDef.children.craftables);

    const visible = craftables.length;

    const acquired = count(craftables, (c) => c.canCraftThis);

    // add an entry for self and return
    return {
      ...commonNodeProperties,
      visible,
      acquired,
      craftables,
    };
  } else if (presentationNodeDef.children.metrics?.length) {
    const metrics = toMetrics(defs, profileResponse, presentationNodeDef.children.metrics);

    // TODO: class based on displayStyle
    const visible = metrics.length;
    const acquired = count(metrics, (m) => Boolean(m.metricComponent.objectiveProgress.complete));
    return {
      ...commonNodeProperties,
      visible,
      acquired,
      metrics,
    };
  } else {
    // call for all children, then add 'em up
    const children: DimPresentationNode[] = [];
    let acquired = 0;
    let visible = 0;
    for (const presentationNode of presentationNodeDef.children.presentationNodes) {
      const subnode = toPresentationNodeTree(
        itemCreationContext,
        presentationNode.presentationNodeHash,
        undefined,
        genderHash,
      );
      if (subnode) {
        acquired += subnode.acquired;
        visible += subnode.visible;
        children.push(subnode);
      }
    }

    if (plugSetCollections) {
      for (const collection of plugSetCollections) {
        // Explicitly do not include counts in parent counts, since it would differ from
        // the numbers shown in-game
        children.push(buildPlugSetPresentationNode(itemCreationContext, collection));
      }
    }
    return {
      ...commonNodeProperties,
      visible,
      acquired,
      childPresentationNodes: children,
    };
  }
}

function buildPlugSetPresentationNode(
  itemCreationContext: ItemCreationContext,
  { hash, displayItem }: { hash: number; displayItem: number },
): DimPresentationNode {
  const plugSetDef = itemCreationContext.defs.PlugSet.get(hash);
  const item = itemCreationContext.defs.InventoryItem.get(displayItem);
  const unlockedItems = unlockedItemsForCharacterOrProfilePlugSet(
    itemCreationContext.profileResponse,
    hash,
    '',
  );
  const plugSetItems = filterMap(plugSetDef.reusablePlugItems, (i) =>
    makeFakeItem(itemCreationContext, i.plugItemHash),
  );
  const plugEntries = plugSetItems.map((item) => ({
    item,
    unlocked: unlockedItems.has(item.hash),
  }));
  const acquired = count(plugEntries, (i) => i.unlocked);

  const subnode: DimPresentationNode = {
    nodeDef: undefined,
    hash: -hash,
    name: item.displayProperties.name,
    icon: item.displayProperties.icon,
    visible: plugSetItems.length,
    acquired,
    plugs: plugEntries,
    nodeComponent: undefined,
  };
  return subnode;
}

function dropEmptyNodes(node: DimPresentationNode | undefined): DimPresentationNode | undefined {
  if (!node) {
    return undefined;
  }
  const children =
    node.collectibles ??
    node.craftables ??
    node.records ??
    node.metrics ??
    node.plugs ??
    node.childPresentationNodes;
  if (children?.length) {
    return node;
  } else {
    return undefined;
  }
}

export function hideCompletedRecords(node: DimPresentationNode): DimPresentationNode {
  if (node.childPresentationNodes) {
    return {
      ...node,
      childPresentationNodes: filterMap(node.childPresentationNodes, (node) =>
        dropEmptyNodes(hideCompletedRecords(node)),
      ),
    };
  }

  if (node.records) {
    return {
      ...node,
      records: node.records.filter(
        (r) => !(r.recordComponent.state & DestinyRecordState.RecordRedeemed),
      ),
    };
  }

  return node;
}

// TODO: how to flatten this down to individual category trees
// TODO: how to handle simple searches plus bigger queries
// TODO: this uses the entire search field as one big string search. no "and". no fun.
export function filterPresentationNodesToSearch(
  node: DimPresentationNode,
  searchQuery: string,
  filterItems: ItemFilter,
  path: DimPresentationNode[] = [],
  defs: D2ManifestDefinitions,
  catalystItemsByRecordHash: Map<number, DimItem>,
): DimPresentationNodeSearchResult[] {
  // If the node itself matches
  if (searchNode(node, searchQuery)) {
    // Return this whole node
    return [{ path: [...path, node] }];
  }

  if (node.childPresentationNodes) {
    // TODO: build up the tree?
    return node.childPresentationNodes.flatMap((c) =>
      filterPresentationNodesToSearch(
        c,
        searchQuery,
        filterItems,
        [...path, node],
        defs,
        catalystItemsByRecordHash,
      ),
    );
  }

  if (node.collectibles) {
    const collectibles = node.collectibles.filter((c) => filterItems(c.item));

    return collectibles.length
      ? [
          {
            path: [...path, node],
            collectibles,
          },
        ]
      : [];
  }

  if (node.records) {
    const records = node.records.filter(
      (r) =>
        searchDisplayProperties(r.recordDef.displayProperties, searchQuery) ||
        searchRewards(r.recordDef, searchQuery, defs) ||
        searchCatalysts(r.recordDef.hash, filterItems, catalystItemsByRecordHash),
    );

    return records.length
      ? [
          {
            path: [...path, node],
            records,
          },
        ]
      : [];
  }

  if (node.metrics) {
    const metrics = node.metrics.filter((r) =>
      searchDisplayProperties(r.metricDef.displayProperties, searchQuery),
    );

    return metrics.length
      ? [
          {
            path: [...path, node],
            metrics,
          },
        ]
      : [];
  }

  if (node.craftables) {
    const craftables = node.craftables.filter((c) => filterItems(c.item));

    return craftables.length
      ? [
          {
            path: [...path, node],
            craftables,
          },
        ]
      : [];
  }

  if (node.plugs) {
    const plugs = node.plugs.filter((p) => filterItems(p.item));

    return plugs.length
      ? [
          {
            path: [...path, node],
            plugs,
          },
        ]
      : [];
  }

  return [];
}

function searchNode(node: DimPresentationNode, searchQuery: string) {
  return (
    (node.nodeDef && searchDisplayProperties(node.nodeDef.displayProperties, searchQuery)) ||
    node.titleInfo?.title.toLowerCase().includes(searchQuery) ||
    node.name.toLowerCase().includes(searchQuery)
  );
}

export function searchDisplayProperties(
  displayProperties: DestinyDisplayPropertiesDefinition,
  searchQuery: string,
) {
  return (
    displayProperties.name.toLowerCase().includes(searchQuery) ||
    displayProperties.description.toLowerCase().includes(searchQuery)
  );
}
function searchRewards(
  record: DestinyRecordDefinition,
  searchQuery: string,
  defs: D2ManifestDefinitions,
) {
  return record.rewardItems.some((ri) =>
    searchDisplayProperties(defs.InventoryItem.get(ri.itemHash).displayProperties, searchQuery),
  );
}

function toCollectibles(
  itemCreationContext: ItemCreationContext,
  collectibleChildren: DestinyPresentationNodeCollectibleChildEntry[],
): DimCollectible[] {
  const { defs, profileResponse } = itemCreationContext;
  return _.compact(
    collectibleChildren.flatMap(({ collectibleHash }) => {
      const fakeItemHash = extraItemCollectibles[collectibleHash];
      const collectibleDef = defs.Collectible.get(collectibleHash);
      if (!collectibleDef) {
        return null;
      }
      const itemHashes = _.compact([collectibleDef.itemHash, fakeItemHash]);
      return itemHashes.map((itemHash) => {
        const state = getCollectibleState(collectibleDef, profileResponse);
        if (
          state === undefined ||
          state & DestinyCollectibleState.Invisible ||
          collectibleDef.redacted
        ) {
          return null;
        }
        const item = makeFakeItem(itemCreationContext, itemHash);
        if (!item) {
          return null;
        }
        item.missingSockets = false;
        return {
          state,
          collectibleDef,
          item,
          key: `${collectibleHash}-${itemHash}`,
          fake: fakeItemHash === itemHash,
        };
      });
    }),
  );
}

function toRecords(
  defs: D2ManifestDefinitions,
  profileResponse: DestinyProfileResponse,
  recordHashes: DestinyPresentationNodeRecordChildEntry[],
): DimRecord[] {
  return filterMap(recordHashes, ({ recordHash }) => toRecord(defs, profileResponse, recordHash));
}

export function toRecord(
  defs: D2ManifestDefinitions,
  profileResponse: DestinyProfileResponse,
  recordHash: number,
  mayBeMissing?: boolean,
): DimRecord | undefined {
  const recordDef = mayBeMissing
    ? defs.Record.getOptional(recordHash)
    : defs.Record.get(recordHash);
  if (!recordDef) {
    return undefined;
  }
  const record = getRecordComponent(recordDef, profileResponse);

  if (record === undefined || record.state & DestinyRecordState.Invisible || recordDef.redacted) {
    return undefined;
  }

  const trackedInGame = profileResponse?.profileRecords?.data?.trackedRecordHash === recordHash;

  return {
    recordComponent: record,
    recordDef,
    trackedInGame,
  };
}

function toCraftables(
  itemCreationContext: ItemCreationContext,
  craftableChildren: DestinyPresentationNodeCraftableChildEntry[],
): DimCraftable[] {
  return filterMap(
    _.sortBy(craftableChildren, (c) => c.nodeDisplayPriority),
    (c) => toCraftable(itemCreationContext, c.craftableItemHash),
  );
}

function toCraftable(
  itemCreationContext: ItemCreationContext,
  itemHash: number,
): DimCraftable | undefined {
  const item = makeFakeItem(itemCreationContext, itemHash);

  if (!item) {
    return;
  }

  const info = getCraftableInfo(item.hash, itemCreationContext.profileResponse);
  if (!info?.visible) {
    return;
  }

  const canCraftThis = info.failedRequirementIndexes.length === 0;
  const canCraftAllPlugs = info.sockets.every((s) =>
    s.plugs.every((p) => p.failedRequirementIndexes.length === 0),
  );

  return { item, canCraftThis, canCraftAllPlugs };
}

function toMetrics(
  defs: D2ManifestDefinitions,
  profileResponse: DestinyProfileResponse,
  metricHashes: DestinyPresentationNodeMetricChildEntry[],
): DimMetric[] {
  return filterMap(metricHashes, ({ metricHash }) => {
    const metricDef = defs.Metric.get(metricHash);
    if (!metricDef) {
      return undefined;
    }
    const metric = getMetricComponent(metricDef, profileResponse);

    if (!metric || metric.invisible || metricDef.redacted) {
      return undefined;
    }

    return {
      metricComponent: metric,
      metricDef,
    };
  });
}

function getRecordComponent(
  recordDef: DestinyRecordDefinition,
  profileResponse: DestinyProfileResponse,
): DestinyRecordComponent | undefined {
  return recordDef.scope === DestinyScope.Character
    ? profileResponse.characterRecords?.data
      ? Object.values(profileResponse.characterRecords.data)[0].records[recordDef.hash]
      : undefined
    : profileResponse.profileRecords?.data?.records[recordDef.hash];
}

function getCraftableInfo(itemHash: number, profileResponse: DestinyProfileResponse) {
  if (!profileResponse.characterCraftables?.data) {
    return;
  }
  const allCharCraftables: (DestinyCraftableComponent | undefined)[] = Object.values(
    profileResponse.characterCraftables.data,
  ).map((d) => d.craftables[itemHash]);

  // try to find a character on whom this item is visible
  return allCharCraftables.find((c) => c?.visible === true) ?? allCharCraftables[0];
}

export function getCollectibleState(
  collectibleDef: DestinyCollectibleDefinition,
  profileResponse: DestinyProfileResponse,
) {
  return collectibleDef.scope === DestinyScope.Character
    ? profileResponse.characterCollectibles?.data
      ? _.minBy(
          // Find the version of the collectible that's unlocked, if any
          Object.values(profileResponse.characterCollectibles.data)
            .map((c) => c.collectibles[collectibleDef.hash].state)
            .filter((s) => s !== undefined),
          (state) => state & DestinyCollectibleState.NotAcquired,
        )
      : undefined
    : profileResponse.profileCollectibles?.data?.collectibles[collectibleDef.hash]?.state;
}

function getMetricComponent(
  metricDef: DestinyMetricDefinition,
  profileResponse: DestinyProfileResponse,
): DestinyMetricComponent | undefined {
  return profileResponse.metrics?.data?.metrics[metricDef.hash];
}

function searchCatalysts(
  recordHash: number,
  filterItems: ItemFilter,
  catalystItemsByRecordHash: Map<number, DimItem>,
): unknown {
  const exoticForCatalyst = catalystItemsByRecordHash.get(recordHash);
  return exoticForCatalyst && filterItems(exoticForCatalyst);
}
