import { trackedTriumphsSelector } from 'app/dim-api/selectors';
import { t } from 'app/i18next-t';
import { InventoryBuckets } from 'app/inventory/inventory-buckets';
import { profileResponseSelector } from 'app/inventory/selectors';
import { DimStore } from 'app/inventory/store-types';
import { useD2Definitions } from 'app/manifest/selectors';
import { toRecord } from 'app/records/presentation-nodes';
import { filterMap } from 'app/utils/collections';
import {
  DestinyEventCardDefinition,
  DestinyPresentationNodeState,
  DestinyRecordState,
  DestinyRecordToastStyle,
} from 'bungie-api-ts/destiny2';
import { useSelector } from 'react-redux';
import * as styles from './Event.m.scss';
import Pursuit from './Pursuit';
import PursuitGrid from './PursuitGrid';
import { sortPursuits } from './Pursuits';
import { recordToPursuitItem } from './milestone-items';

/**
 * A component for showing objectives of seasonal events v2,
 * the format with event cards introduced in Solstice 2022.
 */
export function Event({
  card,
  store,
  buckets,
}: {
  card: DestinyEventCardDefinition;
  store: DimStore;
  buckets: InventoryBuckets;
}) {
  return (
    <PresentationNodeChallenges
      rootNodeHash={card.triumphsPresentationNodeHash}
      store={store}
      buckets={buckets}
      typeName={card.displayProperties.name}
      emptyMessage={t('Progress.NoEventChallenges')}
    />
  );
}

/**
 * Show the records underneath a presentation node as pursuit tiles. Event cards point at
 * a few of these - the event's triumphs, and separately the rotating daily/weekly objectives.
 */
export function PresentationNodeChallenges({
  rootNodeHash,
  store,
  buckets,
  typeName,
  emptyMessage,
  exclusiveToastStyle,
}: {
  rootNodeHash: number;
  store: DimStore;
  buckets: InventoryBuckets;
  typeName: string;
  emptyMessage: string;
  exclusiveToastStyle?: DestinyRecordToastStyle;
}) {
  const defs = useD2Definitions()!;
  const profileResponse = useSelector(profileResponseSelector)!;
  const trackedRecords = useSelector(trackedTriumphsSelector);

  const challengesRootNode = defs.PresentationNode.get(rootNodeHash);
  const childrenNodes = challengesRootNode.children.presentationNodes;

  // Some of these nodes hide children that don't apply right now - Solstice has three
  // different nodes for the three classes and makes two of them invisible. Drop the ones
  // the game explicitly hides, but keep any node it doesn't report on at all, and fall
  // back to every child if that leaves us with nothing.
  const visibleChildrenNodes =
    childrenNodes.length === 1
      ? childrenNodes
      : childrenNodes.filter((node) => {
          const relevantNodeInfo =
            profileResponse.characterPresentationNodes?.data?.[store.id]?.nodes[
              node.presentationNodeHash
            ];
          return (
            !relevantNodeInfo ||
            (relevantNodeInfo.state & DestinyPresentationNodeState.Invisible) === 0
          );
        });

  const presentationNodes = (
    visibleChildrenNodes.length ? visibleChildrenNodes : childrenNodes
  ).map((n) => defs.PresentationNode.get(n.presentationNodeHash));

  // Sort within each child node rather than across all of them, so the nodes stay in the order
  // the manifest lists them.
  const pursuits = presentationNodes.flatMap((n) =>
    filterMap(n.children.records, (h) => toRecord(defs, profileResponse, h.recordHash))
      .filter((r) => {
        // Bungie left unused placeholder records in some of these nodes.
        if (!r.recordDef.displayProperties.name) {
          return false;
        }
        if (
          exclusiveToastStyle !== undefined &&
          r.recordDef.completionInfo.toastStyle !== exclusiveToastStyle
        ) {
          return false;
        }
        // Don't show records that have been redeemed
        const state = r.recordComponent.state;
        const acquired = Boolean(state & DestinyRecordState.RecordRedeemed);
        return !acquired;
      })
      .map((r) =>
        recordToPursuitItem(r, buckets, store, typeName, trackedRecords.includes(r.recordDef.hash)),
      )
      .sort(sortPursuits),
  );

  if (!pursuits.length) {
    return <div className={styles.noRecords}>{emptyMessage}</div>;
  }

  return (
    <PursuitGrid>
      {pursuits.map((item) => (
        <Pursuit item={item} key={item.index} />
      ))}
    </PursuitGrid>
  );
}
