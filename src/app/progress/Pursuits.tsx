import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import CollapsibleTitle from 'app/dim-ui/CollapsibleTitle';
import { t } from 'app/i18next-t';
import { DimItem } from 'app/inventory/item-types';
import { DimStore } from 'app/inventory/store-types';
import { findItemsByBucket } from 'app/inventory/stores-helpers';
import { useD2Definitions } from 'app/manifest/selectors';
import { chainComparator, compareBy } from 'app/utils/comparators';
import { BucketHashes, ItemCategoryHashes } from 'data/d2/generated-enums';
import pursuitsInfoFile from 'data/d2/pursuits.json';
import { useState } from 'react';
import BountyGuide, { BountyFilter, DefType, matchBountyFilters } from './BountyGuide';
import Pursuit, { showPursuitAsExpired } from './Pursuit';
import PursuitGrid from './PursuitGrid';

const defaultExpirationDate = new Date(8640000000000000);

export const sortPursuits = chainComparator(
  compareBy(showPursuitAsExpired),
  compareBy((item) => !item.tracked),
  compareBy((item) => item.complete),
  compareBy((item) =>
    (item.pursuit?.expiration?.expirationDate || defaultExpirationDate).getTime(),
  ),
  compareBy((item) => item.typeName),
  compareBy((item) => item.icon),
  compareBy((item) => item.name),
);

const pursuitsOrder = ['Bounties', 'Quests', 'Items'] as const;

/**
 * List out all the Pursuits for the character, grouped out in a useful way.
 */
export default function Pursuits({ store }: { store: DimStore }) {
  // checked upstream in Progress
  const defs = useD2Definitions()!;

  // Get all items in this character's inventory that represent quests - some are actual items that take
  // up inventory space, others are in the "Progress" bucket and need to be separated from the quest items
  // that represent milestones.
  const pursuits = Object.groupBy(findItemsByBucket(store, BucketHashes.Quests), (item) => {
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
                title={t(`Progress.${group}`, { metadata: { keys: 'progress' } })}
                sectionId={`pursuits-${group}`}
              >
                <PursuitsGroup defs={defs} pursuits={pursuits[group]} store={store} />
              </CollapsibleTitle>
            </section>
          ),
      )}
    </>
  );
}

export function PursuitsGroup({
  defs,
  store,
  pursuits,
  pursuitsInfo = pursuitsInfoFile,
}: {
  defs: D2ManifestDefinitions;
  store: DimStore;
  pursuits: DimItem[];
  pursuitsInfo?: { [hash: string]: { [type in DefType]?: number[] } };
}) {
  const [bountyFilters, setBountyFilters] = useState<BountyFilter[]>([]);

  return (
    <>
      <BountyGuide
        store={store}
        bounties={pursuits}
        selectedFilters={bountyFilters}
        onSelectedFiltersChanged={setBountyFilters}
        pursuitsInfo={pursuitsInfo}
      />
      <PursuitGrid>
        {pursuits.sort(sortPursuits).map((item) => (
          <Pursuit
            item={item}
            key={item.index}
            searchHidden={!matchBountyFilters(defs, item, bountyFilters, pursuitsInfo)}
          />
        ))}
      </PursuitGrid>
    </>
  );
}
