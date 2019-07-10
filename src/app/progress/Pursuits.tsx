import React from 'react';
import { chainComparator, compareBy } from 'app/comparators';
import Pursuit, { showPursuitAsExpired } from './Pursuit';
import _ from 'lodash';
import CollapsibleTitle from 'app/dim-ui/CollapsibleTitle';
import { t } from 'app/i18next-t';
import { DimStore } from 'app/inventory/store-types';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions.service';

const sortQuests = chainComparator(
  compareBy(showPursuitAsExpired),
  compareBy((item) => !item.tracked),
  compareBy((item) => item.complete),
  compareBy((item) => {
    return item.isDestiny2() && item.quest && item.quest.expirationDate
      ? item.quest.expirationDate
      : new Date(8640000000000000);
  }),
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
  defs
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
  const filteredItems = store.buckets[1345459588].concat(
    // Include prophecy tablets, which are in consumables
    store.buckets[1345459588].filter((item) => item.itemCategoryHashes.includes(2250046497))
  );

  const pursuits = _.groupBy(filteredItems, (item) => {
    const itemDef = defs.InventoryItem.get(item.hash);
    if (
      item.itemCategoryHashes.includes(16) ||
      item.itemCategoryHashes.includes(2250046497) ||
      (itemDef && itemDef.objectives && itemDef.objectives.questlineItemHash)
    ) {
      return 'Quests';
    }
    if (!item.objectives || item.objectives.length === 0 || (item.isDestiny2() && item.sockets)) {
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
                  {pursuits[group].sort(sortQuests).map((item) => (
                    <Pursuit item={item} key={item.index} />
                  ))}
                </div>
              </CollapsibleTitle>
            </section>
          )
      )}
    </>
  );
}
