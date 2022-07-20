import { trackedTriumphsSelector } from 'app/dim-api/selectors';
import { t } from 'app/i18next-t';
import { InventoryBuckets } from 'app/inventory/inventory-buckets';
import { profileResponseSelector } from 'app/inventory/selectors';
import { DimStore } from 'app/inventory/store-types';
import { useD2Definitions } from 'app/manifest/selectors';
import { toRecord } from 'app/records/presentation-nodes';
import {
  DestinyEventCardDefinition,
  DestinyPresentationNodeState,
  DestinyRecordState,
} from 'bungie-api-ts/destiny2';
import _ from 'lodash';
import { useSelector } from 'react-redux';
import styles from './Event.m.scss';
import { recordToPursuitItem } from './milestone-items';
import Pursuit from './Pursuit';
import { sortPursuits } from './Pursuits';

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

  // This is a bit weird but Bungie says it should be done this way:
  // The event card references a presentation node with three presentation node children, one
  // per class/character (?)
  // The PresentationNodes component makes two of them invisible per character and one
  // stays visible, so find the one that's actually visible.
  const challengesRootNode = defs.PresentationNode.get(card.triumphsPresentationNodeHash);
  const classSpecificNodeHash = challengesRootNode.children.presentationNodes.find((node) => {
    const relevantNodeInfo =
      profileResponse.characterPresentationNodes?.data?.[store.id]?.nodes[
        node.presentationNodeHash
      ];
    return (
      relevantNodeInfo && (relevantNodeInfo.state & DestinyPresentationNodeState.Invisible) === 0
    );
  });

  const classSpecificNode =
    classSpecificNodeHash && defs.PresentationNode.get(classSpecificNodeHash.presentationNodeHash);

  if (!classSpecificNode) {
    return null;
  }

  const records = _.compact(
    classSpecificNode.children.records.map((h) => toRecord(defs, profileResponse, h.recordHash))
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
        trackedRecords.includes(r.recordDef.hash)
      )
    );

  if (!pursuits.length) {
    return <div className={styles.noRecords}>{t('Progress.NoEventChallenges')}</div>;
  }

  return (
    <div className="progress-for-character">
      {pursuits.sort(sortPursuits).map((item) => (
        <Pursuit item={item} key={item.index} />
      ))}
    </div>
  );
}
