import { AssumeArmorMasterwork, LockArmorEnergyType } from '@destinyitemmanager/dim-api-types';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { AlertIcon } from 'app/dim-ui/AlertIcon';
import { PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import PlugDef from 'app/loadout/loadout-ui/PlugDef';
import { bucketHashToPlugCategoryHash } from 'app/loadout/mod-utils';
import { armor2PlugCategoryHashesByName } from 'app/search/d2-known-values';
import { AppIcon, banIcon } from 'app/shell/icons';
import { DestinyEnergyType } from 'bungie-api-ts/destiny2';
import _ from 'lodash';
import { Dispatch } from 'react';
import ExoticArmorChoice from './filter/ExoticArmorChoice';
import LockedItem from './filter/LockedItem';
import { FilterInfo } from './item-filter';
import { LoadoutBuilderAction } from './loadout-builder-reducer';
import styles from './NoSetsFoundExplainer.m.scss';
import { ProcessInfo } from './process-worker/types';
import { ArmorEnergyRules, LockableBucketHashes, PinnedItems, StatFilters } from './types';

interface ActionableSuggestion {
  id: string;
  contents: React.ReactNode;
}

interface ProblemDescription {
  description: string;
  id: string;
  suggestions: ActionableSuggestion[];
}

export default function NoSetsFoundExplainer({
  defs,
  dispatch,
  autoAssignStatMods,
  lockedMods,
  armorEnergyRules,
  statFilters,
  pinnedItems,
  lockedExoticHash,
  filterInfo,
  processInfo,
}: {
  defs: D2ManifestDefinitions;
  dispatch: Dispatch<LoadoutBuilderAction>;
  autoAssignStatMods: boolean;
  lockedMods: PluggableInventoryItemDefinition[];
  armorEnergyRules: ArmorEnergyRules;
  statFilters: StatFilters;
  pinnedItems: PinnedItems;
  lockedExoticHash: number | undefined;
  filterInfo?: FilterInfo;
  processInfo?: ProcessInfo;
}) {
  const problems: ProblemDescription[] = [];

  const modRow = (mods: PluggableInventoryItemDefinition[]) => (
    <div key="modsDisplay" className={styles.modRow}>
      {mods.map((mod, index) => (
        <PlugDef
          key={index}
          plug={mod}
          onClose={() => dispatch({ type: 'removeLockedMod', mod })}
        />
      ))}
    </div>
  );

  // Easy to diagnose problem -- we have things that aren't
  // armor mods, or deprecated mods. The correct option is
  // to drop them, so offer that.
  const alwaysInvalidMods = filterInfo?.alwaysInvalidMods;
  if (alwaysInvalidMods?.length) {
    problems.push({
      id: 'alwaysInvalidMods',
      description: 'These mods are not valid armor mods:',
      suggestions: [
        {
          id: 'dropInvalidMods',
          contents: (
            <>
              {modRow(alwaysInvalidMods)},
              <button
                key="removeAllInvalid"
                type="button"
                className="dim-button"
                onClick={() => dispatch({ type: 'removeLockedMods', mods: alwaysInvalidMods })}
              >
                <AppIcon icon={banIcon} /> Remove these mods
              </button>
            </>
          ),
        },
      ],
    });
  }

  const lockedModMap = _.groupBy(lockedMods, (mod) => mod.plug.plugCategoryHash);
  const generalMods = lockedModMap[armor2PlugCategoryHashesByName.general] || [];

  // Also quite easy to diagnose: If a bucket has no valid pieces before we send to the worker,
  // then we should consider removing some item restrictions (such as unpinning/unrestricting items)
  // or removing mods.
  if (filterInfo) {
    const lockedExoticBucketHash =
      lockedExoticHash !== undefined &&
      lockedExoticHash > 0 &&
      defs.InventoryItem.get(lockedExoticHash).inventory!.bucketTypeHash;
    for (const bucketHash of LockableBucketHashes) {
      const bucketInfo = filterInfo.perBucketStats[bucketHash];
      const bucketMods = lockedModMap[bucketHashToPlugCategoryHash[bucketHash]];
      if (bucketInfo.totalConsidered > 0 && bucketInfo.finalValid === 0 && bucketMods?.length) {
        const suggestions: ActionableSuggestion[] = [
          {
            id: 'considerDroppingMods',
            contents: (
              <>
                {modRow(bucketMods)}
                <i key="hint">Consider removing these mods.</i>
              </>
            ),
          },
        ];
        const pinnedItem = pinnedItems[bucketHash];
        if (pinnedItem) {
          suggestions.push({
            id: 'considerUnpinningItem',
            contents: (
              <>
                <div key="item" className={styles.modRow}>
                  <LockedItem
                    lockedItem={pinnedItem}
                    onRemove={() => dispatch({ type: 'unpinItem', item: pinnedItem })}
                  />
                </div>
                <i key="hint">Consider unpinning this item.</i>
              </>
            ),
          });
        }

        if (bucketHash === lockedExoticBucketHash) {
          suggestions.push({
            id: 'considerRemovingExotic',
            contents: (
              <>
                <div key="item" className={styles.modRow}>
                  <ExoticArmorChoice
                    lockedExoticHash={lockedExoticHash!}
                    onClose={() => dispatch({ type: 'removeLockedExotic' })}
                  />
                </div>
                <i key="hint">Consider removing your exotic choice.</i>
              </>
            ),
          });
        }

        problems.push({
          id: `badBucket-${bucketHash}`,
          description: `The ${defs.InventoryBucket[bucketHash].displayProperties.name} slot does not have items that can fit these mods.`,
          suggestions,
        });
      }
    }
  }

  const anyStatMinimums = Object.values(statFilters).some((f) => !f.ignored && f.min > 0);

  const elementMayCauseProblems =
    armorEnergyRules.lockArmorEnergyType !== LockArmorEnergyType.None &&
    lockedMods.some(
      (mod) => mod.plug.energyCost && mod.plug.energyCost.energyType !== DestinyEnergyType.Any
    );
  const capacityMayCauseProblems =
    armorEnergyRules.assumeArmorMasterwork !== AssumeArmorMasterwork.All &&
    (lockedMods.length || anyStatMinimums);

  if (
    (!alwaysInvalidMods || alwaysInvalidMods.length === 0) &&
    (elementMayCauseProblems || capacityMayCauseProblems)
  ) {
    // If we might have problems assigning bucket specific mods or mods in the
    // process worker, offer some advice.
    problems.push({
      id: 'armorEnergyRestrictions',
      description:
        'DIM is restricted in what assumptions it can make about armor energy type and capacity.',
      suggestions: _.compact([
        capacityMayCauseProblems && {
          id: 'assumeMasterworked',
          contents: (
            <button
              key="assumeMasterworked"
              type="button"
              className="dim-button"
              onClick={() =>
                dispatch({
                  type: 'assumeArmorMasterworkChanged',
                  assumeArmorMasterwork: AssumeArmorMasterwork.All,
                })
              }
            >
              Assume armor is masterworked
            </button>
          ),
        },
        elementMayCauseProblems && {
          id: 'allowEnergyChanges',
          contents: (
            <button
              key="allowEnergyChanges"
              type="button"
              className="dim-button"
              onClick={() =>
                dispatch({
                  type: 'lockArmorEnergyTypeChanged',
                  lockArmorEnergyType: LockArmorEnergyType.None,
                })
              }
            >
              Allow changes to armor elements
            </button>
          ),
        },
      ]),
    });
  }

  // This time we made it to the LO worker process,
  // so time to investigate why LO could not find a single set.
  if (processInfo) {
    if (filterInfo?.searchQueryEffective) {
      problems.push({
        id: 'searchQuery',
        description:
          'An active search query is restricting the items DIM is considering for builds.',
        suggestions: [
          {
            id: 'clearQuery',
            contents: <i>Consider clearing your search query.</i>,
          },
        ],
      });
    }

    const allPinnedItems = _.compact(LockableBucketHashes.map((hash) => pinnedItems[hash]));
    const unpinItemsSuggestion = allPinnedItems.length > 0 && {
      id: 'considerUnpinningItems',
      contents: (
        <>
          {allPinnedItems.map((pinnedItem) => (
            <div key={pinnedItem.id} className={styles.modRow}>
              <LockedItem
                lockedItem={pinnedItem}
                onRemove={() => dispatch({ type: 'unpinItem', item: pinnedItem })}
              />
            </div>
          ))}
          <i key="hint">Consider unpinning items.</i>
        </>
      ),
    };

    // This is a bit ugly -- we essentially have to reverse engineer where sets fail in the worker process.
    if (processInfo.stats.cantSlotAutoMods > 0) {
      problems.push({
        id: 'cantSlotAutoMods',
        description: `${processInfo.stats.cantSlotAutoMods} sets can fit all mods, but do not have enough energy or slots left over to pick stat mods to hit requested stat tiers.`,
        suggestions: _.compact([
          {
            id: 'hint',
            contents: <i>Consider reducing stat minimums.</i>,
          },
          lockedMods.length > 0 && {
            id: 'hint2',
            contents: (
              <>
                {modRow(lockedMods)}
                <i key="hint">Consider removing some mods.</i>
              </>
            ),
          },
          unpinItemsSuggestion,
        ]),
      });
    } else if (processInfo.stats.cantSlotMods > 0) {
      problems.push({
        id: 'cantSlotMods',
        description: `${processInfo.stats.cantSlotMods} sets could not fit all requested mods.`,
        suggestions: _.compact([
          {
            id: 'hint',
            contents: (
              <>
                {modRow(lockedMods)}
                <i key="hint">Consider removing some mods.</i>
              </>
            ),
          },
          unpinItemsSuggestion,
        ]),
      });
    } else if (processInfo.stats.noAutoModsPick > 0) {
      // There's literally no valid way to pick stat mods to hit these stats, so consider relaxing stat requirements
      problems.push({
        id: 'noAutoModsPick',
        description: `For ${processInfo.stats.noAutoModsPick} sets, it's not possible to pick stat mods to hit requested stat tiers.`,
        suggestions: _.compact([
          generalMods.length > 0 && {
            id: 'hint1',
            contents: (
              <>
                {modRow(generalMods)}
                <i key="hint">Consider removing some mods.</i>
              </>
            ),
          },
          {
            id: 'hint2',
            contents: <i key="hint">Consider reducing stat minimums.</i>,
          },
          unpinItemsSuggestion,
        ]),
      });
    } else if (
      processInfo.stats.lowerBoundsExceeded > 0 ||
      processInfo.stats.upperBoundsExceeded > 0
    ) {
      if (processInfo.stats.lowerBoundsExceeded > 0) {
        problems.push({
          id: 'lowerBoundsExceeded',
          description: `${processInfo.stats.lowerBoundsExceeded} sets did not hit requested stat tiers.`,
          suggestions: _.compact([
            !autoAssignStatMods &&
              $featureFlags.loAutoStatMods && {
                id: 'hint1',
                contents: <i>Consider allowing DIM to assign stat mods.</i>,
              },
            {
              id: 'hint2',
              contents: <i>Consider reducing stat minimums.</i>,
            },
            unpinItemsSuggestion,
          ]),
        });
      }

      if (processInfo.stats.upperBoundsExceeded > 0) {
        problems.push({
          id: 'upperBoundsExceeded',
          description: `${processInfo.stats.upperBoundsExceeded} sets had too high stats.`,
          suggestions: _.compact([
            {
              id: 'hint',
              contents: <i>Consider increasing stat maximums.</i>,
            },
            unpinItemsSuggestion,
          ]),
        });
      }
    }
  }

  return (
    <div className={styles.noBuildsExplainerContainer}>
      <h3 className={styles.noBuildsFoundMsg}>
        <AlertIcon />
        No builds found. Here are possible reasons DIM couldn't find any sets:
      </h3>
      {problems.length > 0 && (
        <ul>
          {problems.map((p) => (
            <li key={p.id}>
              <div className={styles.problemDescription}>
                <h3>{p.description}</h3>
                <div className={styles.suggestionList}>
                  {p.suggestions.map((suggestion) => (
                    <div key={suggestion.id}>{suggestion.contents}</div>
                  ))}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
