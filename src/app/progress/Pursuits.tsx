import CollapsibleTitle from 'app/dim-ui/CollapsibleTitle';
import FilterPills, { Option } from 'app/dim-ui/FilterPills';
import { t } from 'app/i18next-t';
import { DimItem } from 'app/inventory/item-types';
import { DimStore } from 'app/inventory/store-types';
import { findItemsByBucket } from 'app/inventory/stores-helpers';
import { useD2Definitions } from 'app/manifest/selectors';
import { chainComparator, compareBy } from 'app/utils/comparators';
import { BucketHashes, ItemCategoryHashes } from 'data/d2/generated-enums';
import pursuitsInfoFile from 'data/d2/pursuits.json';
import _ from 'lodash';
import { useMemo, useState } from 'react';
import BountyGuide, { BountyFilter, DefType, matchBountyFilters } from './BountyGuide';
import Pursuit, { showPursuitAsExpired } from './Pursuit';
import PursuitGrid from './PursuitGrid';

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

const pursuitsOrder = ['Bounties', 'Quests', 'Items'] as const;

// FIXME use d2ai trait hashes
const pursuitCategoryTraitHashes = [
  3671004794, // Trait "Seasonal"
  2878306895, // Trait "Lightfall"
  370766376, // Trait "Exotics"
  500105683, // Trait "Playlists"
  2387836362, // Trait "The Past"
];

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
                title={t(`Progress.${group}`, { metadata: { keys: 'progress' } })}
                sectionId={'pursuits-' + group}
              >
                <PursuitsGroup
                  includeQuestTraits={group === 'Quests'}
                  pursuits={pursuits[group]}
                  store={store}
                />
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
  includeQuestTraits,
  pursuitsInfo = pursuitsInfoFile,
}: {
  store: DimStore;
  pursuits: DimItem[];
  hideDescriptions?: boolean;
  includeQuestTraits?: boolean;
  pursuitsInfo?: { [hash: string]: { [type in DefType]?: number[] } };
}) {
  const defs = useD2Definitions()!;
  const [bountyFilters, setBountyFilters] = useState<BountyFilter[]>([]);
  const [questPillsComponent, activeTraitHashes] = useQuestsFilter(includeQuestTraits);

  return (
    <>
      <BountyGuide
        store={store}
        bounties={pursuits}
        selectedFilters={bountyFilters}
        onSelectedFiltersChanged={setBountyFilters}
        pursuitsInfo={pursuitsInfo}
      />
      {questPillsComponent}
      <PursuitGrid>
        {pursuits.sort(sortPursuits).map((item) => (
          <Pursuit
            item={item}
            key={item.index}
            searchHidden={
              !(
                (activeTraitHashes.length === 0 ||
                  activeTraitHashes.some((hash) =>
                    defs.InventoryItem.get(item.hash).traitHashes?.includes(hash)
                  )) &&
                matchBountyFilters(item, bountyFilters, pursuitsInfo)
              )
            }
            hideDescription={hideDescriptions}
          />
        ))}
      </PursuitGrid>
    </>
  );
}

function useQuestsFilter(
  active: boolean | undefined
): [comp: React.ReactNode, activeTraitHashes: number[]] {
  const defs = useD2Definitions()!;

  const options = useMemo(
    () =>
      _.compact(
        pursuitCategoryTraitHashes.map((hash) => {
          const def = defs.Trait.get(hash);
          return def && { key: hash, content: def.displayProperties.name };
        })
      ),
    [defs.Trait]
  );

  const [selectedFilters, setSelectedFilters] = useState<Option<number>[]>([]);
  const activeTraitHashes = selectedFilters.map(({ key }) => key);

  return [
    active ? (
      <FilterPills
        options={options}
        selectedOptions={selectedFilters}
        onOptionsSelected={setSelectedFilters}
      />
    ) : null,
    activeTraitHashes,
  ];
}
