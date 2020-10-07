import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import InventoryCollapsibleTitle from 'app/inventory/InventoryCollapsibleTitle';
import { DimStore } from 'app/inventory/store-types';
import { findItemsByBucket } from 'app/inventory/stores-helpers';
import Pursuit from 'app/progress/Pursuit';
import { sortPursuits } from 'app/progress/Pursuits';
import { BucketHashes, ItemCategoryHashes } from 'data/d2/generated-enums';
import React from 'react';

/**
 * List out all the Pursuits for the character, grouped out in a useful way.
 */
export default function PursuitsView({
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

  const pursuits = filteredItems.filter((item) => {
    const itemDef = defs.InventoryItem.get(item.hash);
    if (
      item.itemCategoryHashes.includes(ItemCategoryHashes.QuestStep) ||
      item.itemCategoryHashes.includes(ItemCategoryHashes.ProphecyTablets) ||
      itemDef?.objectives?.questlineItemHash
    ) {
      return item.tracked;
    }
    if (!item.objectives || item.objectives.length === 0 || item.sockets) {
      return false;
    }

    return true;
  });

  const trackingQuests = pursuits.some((item) => item.tracked);

  return (
    <InventoryCollapsibleTitle
      title={`Pursuits`}
      sectionId={'pursuits'}
      stores={[store]}
      defaultCollapsed={true}
    >
      <div className="active-pursuits">
        {pursuits.sort(sortPursuits).map((item) => (
          <Pursuit item={item} key={item.index} defs={defs} hideDescription={true} />
        ))}
        {!trackingQuests && <div className="no-quests">You're not tracking any quests</div>}
      </div>
    </InventoryCollapsibleTitle>
  );
}
