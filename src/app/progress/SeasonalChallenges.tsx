import { trackedTriumphsSelector } from 'app/dim-api/selectors';
import CollapsibleTitle from 'app/dim-ui/CollapsibleTitle';
import { InventoryBuckets } from 'app/inventory-stores/inventory-buckets';
import { DimItem } from 'app/inventory-stores/item-types';
import { DimStore } from 'app/inventory-stores/store-types';
import { useD2Definitions } from 'app/manifest/selectors';
import {
  DimPresentationNode,
  DimRecord,
  toPresentationNodeTree,
} from 'app/records/presentation-nodes';
import { chainComparator, compareBy } from 'app/utils/comparators';
import {
  DestinyPresentationNodeDefinition,
  DestinyProfileResponse,
  DestinyRecordState,
} from 'bungie-api-ts/destiny2';
import seasonalChallengesInfo from 'data/d2/seasonal-challenges.json';
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import BountyGuide, { BountyFilter, DefType, matchBountyFilters } from './BountyGuide';
import { recordToPursuitItem } from './milestone-items';
import Pursuit, { showPursuitAsExpired } from './Pursuit';

const defaultExpirationDate = new Date(8640000000000000);

export const sortPursuits = chainComparator(
  compareBy(showPursuitAsExpired),
  compareBy((item) => !item.tracked),
  compareBy((item) => item.complete),
  compareBy((item) => (item.pursuit?.expirationDate || defaultExpirationDate).getTime()),
  compareBy((item) => item.typeName),
  compareBy((item) => item.icon),
  compareBy((item) => item.name)
);

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
  const nodeTree = toPresentationNodeTree(
    defs,
    buckets,
    profileResponse,
    seasonalChallengesPresentationNode.hash
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
        <PursuitsGroup pursuits={pursuits} store={store} />
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

function PursuitsGroup({
  store,
  pursuits,
  hideDescriptions,
  skipTypes,
}: {
  store: DimStore;
  pursuits: DimItem[];
  hideDescriptions?: boolean;
  skipTypes?: DefType[];
}) {
  const [bountyFilters, setBountyFilters] = useState<BountyFilter[]>([]);

  return (
    <>
      <BountyGuide
        store={store}
        bounties={pursuits}
        selectedFilters={bountyFilters}
        onSelectedFiltersChanged={setBountyFilters}
        skipTypes={skipTypes}
        pursuitsInfo={seasonalChallengesInfo}
      />
      <div className="progress-for-character">
        {pursuits.sort(sortPursuits).map((item) => (
          <Pursuit
            item={item}
            key={item.index}
            searchHidden={!matchBountyFilters(item, bountyFilters, seasonalChallengesInfo)}
            hideDescription={hideDescriptions}
          />
        ))}
      </div>
    </>
  );
}
