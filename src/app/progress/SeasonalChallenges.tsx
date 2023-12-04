import { trackedTriumphsSelector } from 'app/dim-api/selectors';
import CollapsibleTitle from 'app/dim-ui/CollapsibleTitle';
import { createItemContextSelector } from 'app/inventory/selectors';
import { DimStore } from 'app/inventory/store-types';
import {
  DimPresentationNode,
  DimRecord,
  toPresentationNodeTree,
} from 'app/records/presentation-nodes';
import { DestinyPresentationNodeDefinition, DestinyRecordState } from 'bungie-api-ts/destiny2';
import seasonalChallengesInfo from 'data/d2/seasonal-challenges.json';
import { useSelector } from 'react-redux';
import { PursuitsGroup } from './Pursuits';
import { recordToPursuitItem } from './milestone-items';

/**
 * List out all the seasonal challenges for the character, grouped out in a useful way.
 */
export default function SeasonalChallenges({
  seasonalChallengesPresentationNode,
  store,
}: {
  seasonalChallengesPresentationNode: DestinyPresentationNodeDefinition;
  store: DimStore;
}) {
  const itemCreationContext = useSelector(createItemContextSelector);
  const nodeTree = toPresentationNodeTree(
    itemCreationContext,
    seasonalChallengesPresentationNode.hash,
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
        itemCreationContext.buckets,
        store,
        seasonalChallengesPresentationNode.displayProperties.name,
        trackedRecords.includes(r.recordDef.hash),
      ),
    );

  return (
    <section id="seasonal-challenges">
      <CollapsibleTitle
        title={seasonalChallengesPresentationNode.displayProperties.name}
        sectionId="seasonal-challenges"
      >
        <PursuitsGroup
          defs={itemCreationContext.defs}
          pursuits={pursuits}
          store={store}
          pursuitsInfo={seasonalChallengesInfo}
        />
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
