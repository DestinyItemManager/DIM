import { settingSelector, trackedTriumphsSelector } from 'app/dim-api/selectors';
import CollapsibleTitle from 'app/dim-ui/CollapsibleTitle';
import { InventoryBuckets } from 'app/inventory/inventory-buckets';
import { DimStore } from 'app/inventory/store-types';
import { useD2Definitions } from 'app/manifest/selectors';
import {
  DimPresentationNode,
  DimRecord,
  toPresentationNodeTree,
} from 'app/records/presentation-nodes';
import {
  DestinyPresentationNodeDefinition,
  DestinyProfileResponse,
  DestinyRecordState,
} from 'bungie-api-ts/destiny2';
import seasonalChallengesInfo from 'data/d2/seasonal-challenges.json';
import { useSelector } from 'react-redux';
import { recordToPursuitItem } from './milestone-items';
import { PursuitsGroup } from './Pursuits';

/**
 * List out all the seasonal challenges for the character, grouped out in a useful way.
 */
export default function SeasonalChallenges({
  seasonalChallengesPresentationNode,
  store,
  buckets,
  profileResponse,
}: {
  seasonalChallengesPresentationNode: DestinyPresentationNodeDefinition;
  store: DimStore;
  buckets: InventoryBuckets;
  profileResponse: DestinyProfileResponse;
}) {
  const defs = useD2Definitions()!;
  const customTotalStatsByClass = useSelector(settingSelector('customTotalStatsByClass'));
  const nodeTree = toPresentationNodeTree(
    defs,
    buckets,
    profileResponse,
    seasonalChallengesPresentationNode.hash,
    customTotalStatsByClass
  );

  const allRecords = nodeTree ? flattenRecords(nodeTree) : [];

  const trackedRecords = useSelector(trackedTriumphsSelector);

  const pursuits = allRecords
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
        seasonalChallengesPresentationNode.displayProperties.name,
        trackedRecords.includes(r.recordDef.hash)
      )
    );

  return (
    <section id="seasonal-challenges">
      <CollapsibleTitle
        title={seasonalChallengesPresentationNode.displayProperties.name}
        sectionId="seasonal-challenges"
      >
        <PursuitsGroup pursuits={pursuits} store={store} pursuitsInfo={seasonalChallengesInfo} />
      </CollapsibleTitle>
    </section>
  );
}

function flattenRecords(nodeTree: DimPresentationNode): DimRecord[] {
  let records = nodeTree.records || [];

  if (nodeTree.childPresentationNodes) {
    records = [...records, ...nodeTree.childPresentationNodes.flatMap(flattenRecords)];
  }

  return records;
}
