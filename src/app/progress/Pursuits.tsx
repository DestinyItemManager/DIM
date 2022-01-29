import CollapsibleTitle from 'app/dim-ui/CollapsibleTitle';
import { t } from 'app/i18next-t';
import { DimItem } from 'app/inventory-stores/item-types';
import { DimStore } from 'app/inventory-stores/store-types';
import { findItemsByBucket } from 'app/inventory-stores/stores-helpers';
import { useD2Definitions } from 'app/manifest/selectors';
import { chainComparator, compareBy } from 'app/utils/comparators';
import { BucketHashes, ItemCategoryHashes } from 'data/d2/generated-enums';
import _ from 'lodash';
import React, { useState } from 'react';
import BountyGuide, { BountyFilter, DefType, matchBountyFilters } from './BountyGuide';
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

const pursuitsOrder = ['Bounties', 'Quests', 'Items'];

/**
 * List out all the Pursuits for the character, grouped out in a useful way.
 */
export default function Pursuits({ store }: { store: DimStore }) {
  // checked upstream in Progress
  const defs = useD2Definitions()!;

  // Get all items in this character's inventory that represent quests - some are actual items that take
  // up inventory space, others are in the "Progress" bucket and need to be separated from the quest items
  // that represent milestones.
  const pursuits = _.groupBy(findItemsByBucket(store, BucketHashes.Quests), (item) => {
    const itemDef = defs.InventoryItem.get(item.hash);
    if (!item.objectives || item.objectives.length === 0 || item.sockets) {
      return 'Items';
    }
    if (
      item.itemCategoryHashes.includes(ItemCategoryHashes.QuestStep) ||
      itemDef?.objectives?.questlineItemHash
    ) {
      return 'Quests';
    }

    return 'Bounties';
  });

  return (
    <>
      {pursuitsOrder.map(
        (group) =>
          pursuits[group] && (
            <section id={group} key={group}>
              <CollapsibleTitle
                title={t(`Progress.${group}`, { contextList: 'progress' })}
                sectionId={'pursuits-' + group}
              >
                <PursuitsGroup pursuits={pursuits[group]} store={store} />
              </CollapsibleTitle>
            </section>
          )
      )}
    </>
  );
}

export function PursuitsGroup({
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
      />
      <div className="progress-for-character">
        {pursuits.sort(sortPursuits).map((item) => (
          <Pursuit
            item={item}
            key={item.index}
            searchHidden={!matchBountyFilters(item, bountyFilters)}
            hideDescription={hideDescriptions}
          />
        ))}
      </div>
    </>
  );
}
