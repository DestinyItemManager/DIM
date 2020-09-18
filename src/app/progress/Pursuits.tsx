import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import CollapsibleTitle from 'app/dim-ui/CollapsibleTitle';
import { t } from 'app/i18next-t';
import { DimStore } from 'app/inventory/store-types';
import { findItemsByBucket } from 'app/inventory/stores-helpers';
import { chainComparator, compareBy } from 'app/utils/comparators';
import { BucketHashes, ItemCategoryHashes } from 'data/d2/generated-enums';
import _ from 'lodash';
import React from 'react';
import Pursuit, { showPursuitAsExpired } from './Pursuit';

const defaultExpirationDate = new Date(8640000000000000);

export const sortPursuits = chainComparator(
  compareBy(showPursuitAsExpired),
  compareBy((item) => !item.tracked),
  compareBy((item) => item.complete),
  compareBy((item) => item.pursuit?.expirationDate || defaultExpirationDate),
  compareBy((item) => item.typeName),
  compareBy((item) => item.icon),
  compareBy((item) => item.name)
);

const pursuitsOrder = ['Bounties', 'Quests', 'Items'];

/**
 * List out all the Pursuits for the character, grouped out in a useful way.
 */
export default function Pursuits({
  store,
  defs,
}: {
  store: DimStore;
  defs?: D2ManifestDefinitions;
}) {
  if (!defs) {
    return null;
  }

  // Get all items in this character's inventory that represent quests - some are actual items that take
  // up inventory space, others are in the "Progress" bucket and need to be separated from the quest items
  // that represent milestones.
  const filteredItems = findItemsByBucket(store, BucketHashes.Quests).concat(
    // Include prophecy tablets, which are in consumables
    findItemsByBucket(store, BucketHashes.Consumables).filter((item) =>
      item.itemCategoryHashes.includes(ItemCategoryHashes.ProphecyTablets)
    )
  );

  const pursuits = _.groupBy(filteredItems, (item) => {
    const itemDef = defs.InventoryItem.get(item.hash);
    if (
      item.itemCategoryHashes.includes(ItemCategoryHashes.QuestStep) ||
      item.itemCategoryHashes.includes(ItemCategoryHashes.ProphecyTablets) ||
      itemDef?.objectives?.questlineItemHash
    ) {
      return 'Quests';
    }
    if (!item.objectives || item.objectives.length === 0 || item.sockets) {
      return 'Items';
    }

    return 'Bounties';
  });

  return (
    <>
      {pursuitsOrder.map(
        (group) =>
          pursuits[group] && (
            <section id={group} key={group}>
              <CollapsibleTitle title={t(`Progress.${group}`)} sectionId={'pursuits-' + group}>
                <div className="progress-for-character">
                  {pursuits[group].sort(sortPursuits).map((item) => (
                    <Pursuit item={item} key={item.index} defs={defs} />
                  ))}
                </div>
              </CollapsibleTitle>
            </section>
          )
      )}
    </>
  );
}
