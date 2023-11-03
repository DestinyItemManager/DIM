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
} from 'bungie-api-ts/destiny2';
import { useSelector } from 'react-redux';
import styles from './Event.m.scss';
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
  const defs = useD2Definitions()!;
  const profileResponse = useSelector(profileResponseSelector)!;
  const trackedRecords = useSelector(trackedTriumphsSelector);

  const challengesRootNode = defs.PresentationNode.get(card.triumphsPresentationNodeHash);
  const childrenNodes = challengesRootNode.children.presentationNodes;
  const classSpecificNodeHash =
    childrenNodes.length === 1
      ? // If we only have one node, it's probably the right node.
        childrenNodes[0]
      : // This is for Solstice, which has three different nodes for the three characters.
        // The PresentationNodes component makes two of them invisible per character and one
        // stays visible, so find the one that's actually visible.
        childrenNodes.find((node) => {
          const relevantNodeInfo =
            profileResponse.characterPresentationNodes?.data?.[store.id]?.nodes[
              node.presentationNodeHash
            ];
          return (
            relevantNodeInfo &&
            (relevantNodeInfo.state & DestinyPresentationNodeState.Invisible) === 0
          );
        });

  const classSpecificNode =
    classSpecificNodeHash && defs.PresentationNode.get(classSpecificNodeHash.presentationNodeHash);

  if (!classSpecificNode) {
    return null;
  }

  const records = filterMap(classSpecificNode.children.records, (h) =>
    toRecord(defs, profileResponse, h.recordHash),
  );

  const pursuits = records
    .filter((r) => {
      // Don't show records that have been redeemed
      const state = r.recordComponent.state;
      const acquired = Boolean(state & DestinyRecordState.RecordRedeemed);
      return !acquired;
    })
    .map((r) =>
      recordToPursuitItem(
        r,
        buckets,
        store,
        card.displayProperties.name,
        trackedRecords.includes(r.recordDef.hash),
      ),
    );

  if (!pursuits.length) {
    return <div className={styles.noRecords}>{t('Progress.NoEventChallenges')}</div>;
  }

  return (
    <PursuitGrid>
      {pursuits.sort(sortPursuits).map((item) => (
        <Pursuit item={item} key={item.index} />
      ))}
    </PursuitGrid>
  );
}
