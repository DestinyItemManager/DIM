import { AssumeArmorMasterwork, LockArmorEnergyType } from '@destinyitemmanager/dim-api-types';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { AlertIcon } from 'app/dim-ui/AlertIcon';
import { PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { activityModPlugCategoryHashes } from 'app/loadout/known-values';
import PlugDef from 'app/loadout/loadout-ui/PlugDef';
import { bucketHashToPlugCategoryHash } from 'app/loadout/mod-utils';
import { armor2PlugCategoryHashesByName } from 'app/search/d2-known-values';
import { combatCompatiblePlugCategoryHashes } from 'app/search/specialty-modslots';
import { AppIcon, banIcon } from 'app/shell/icons';
import { DestinyEnergyType } from 'bungie-api-ts/destiny2';
import _ from 'lodash';
import { Dispatch } from 'react';
import ExoticArmorChoice from './filter/ExoticArmorChoice';
import LockedItem from './filter/LockedItem';
import { FilterInfo } from './item-filter';
import { LoadoutBuilderAction } from './loadout-builder-reducer';
import styles from './NoSetsFoundExplainer.m.scss';
import { ProcessStatistics, RejectionRatio } from './process-worker/types';
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

/** How many sets can be excluded by upper bounds before we warn. Not too high because upper bounds are rarely useful. */
const UPPER_STAT_BOUNDS_WARN_RATIO = 0.8;
/**
 * How many sets can be excluded by lower bounds before we warn.
 * Quite high because LO's purpose is literally to sift through tons of garbage sets.
 */
const LOWER_STAT_BOUNDS_WARN_RATIO = 0.95;
/**
 * >98% usually only happens when you select activity mods or restrictive mod settings and tons
 * of combat mods with the same element
 */
const EARLY_MOD_REJECTION_WARN_RATIO = 0.98;

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
  processInfo?: ProcessStatistics;
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
  const combatMods = Object.entries(lockedModMap).flatMap(([plugCategoryHash, mods]) =>
    mods && combatCompatiblePlugCategoryHashes.includes(Number(plugCategoryHash)) ? mods : []
  );
  const activityMods = Object.entries(lockedModMap).flatMap(([plugCategoryHash, mods]) =>
    mods && activityModPlugCategoryHashes.includes(Number(plugCategoryHash)) ? mods : []
  );

  let failedModsInBucket = false;

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
        failedModsInBucket = true;
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
    (processInfo?.statistics.modsStatistics.earlyModsCheck.timesFailed ||
      processInfo?.statistics.modsStatistics.finalAssignment.modsAssignmentFailed ||
      failedModsInBucket) &&
    lockedMods.some(
      (mod) => mod.plug.energyCost && mod.plug.energyCost.energyType !== DestinyEnergyType.Any
    );
  const capacityMayCauseProblems =
    armorEnergyRules.assumeArmorMasterwork !== AssumeArmorMasterwork.All &&
    (processInfo?.statistics.modsStatistics.finalAssignment.modsAssignmentFailed ||
      processInfo?.statistics.modsStatistics.finalAssignment.autoModsAssignmentFailed ||
      failedModsInBucket) &&
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
    let usedUnpinSuggestion = false;
    const unpinItemsSuggestion = () => {
      if (usedUnpinSuggestion) {
        return undefined;
      }
      usedUnpinSuggestion = true;
      return (
        allPinnedItems.length > 0 && {
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
        }
      );
    };

    // Here, we check which parts of the worker process rejected a ton of sets. LO essentially
    // checks upper bounds, lower bounds, mod assignments in that order. If a step checked more than
    // 0 sets and failed 100% of them, it should be worth reporting -- but if, say, the stat bounds check
    // rejected 99.9% of sets and then left 1 set through, and then we failed to assign combat mods to that
    // 1 set, then blaming the selected combat mods is kind of unfair, so we should show steps that reject a high percentage
    // too. Maybe some statistical confidence calculation could be useful here, but let's just use some numbers that made sense in testing.

    const isInteresting = ({ timesChecked, timesFailed }: RejectionRatio, threshold: number) =>
      timesChecked > 0 && timesFailed / timesChecked >= threshold;

    const {
      lowerBoundsExceeded,
      upperBoundsExceeded,
      modsStatistics: modsStats,
    } = processInfo.statistics;

    if (isInteresting(upperBoundsExceeded, UPPER_STAT_BOUNDS_WARN_RATIO)) {
      problems.push({
        id: 'upperBoundsExceeded',
        description: `${upperBoundsExceeded.timesFailed} sets had too high stats.`,
        suggestions: _.compact([
          {
            id: 'hint',
            contents: <i>Consider increasing stat maximums.</i>,
          },
          unpinItemsSuggestion(),
        ]),
      });
    }

    if (isInteresting(lowerBoundsExceeded, LOWER_STAT_BOUNDS_WARN_RATIO)) {
      problems.push({
        id: 'lowerBoundsExceeded',
        description: `${lowerBoundsExceeded.timesFailed} sets did not hit requested stat tiers.`,
        suggestions: _.compact([
          !autoAssignStatMods &&
            $featureFlags.loAutoStatMods && {
              id: 'hint1',
              contents: <i>Consider allowing DIM to pick stat mods.</i>,
            },
          {
            id: 'hint2',
            contents: <i>Consider reducing stat minimums.</i>,
          },
          unpinItemsSuggestion(),
        ]),
      });
    }

    if (modsStats.earlyModsCheck.timesChecked > 0) {
      // If we got here, we took a closer look at a number of sets, but failed to pick/assign mods.

      if (isInteresting(modsStats.earlyModsCheck, EARLY_MOD_REJECTION_WARN_RATIO)) {
        problems.push({
          id: 'noAutoModsPick',
          description: `${modsStats.earlyModsCheck.timesFailed} sets can't fit requested mods due to energy type or mod slot requirements.`,
          suggestions: _.compact([
            (combatMods.length > 0 || activityMods.length > 0) && {
              id: 'hint1',
              contents: (
                <>
                  {modRow([...combatMods, ...activityMods])}
                  <i key="hint">Consider removing some mods.</i>
                </>
              ),
            },
            unpinItemsSuggestion(),
          ]),
        });
      }

      if (isInteresting(modsStats.autoModsPick, LOWER_STAT_BOUNDS_WARN_RATIO)) {
        // We fail to pick stat mods to hit these stats very often, so consider relaxing stat requirements
        problems.push({
          id: 'noAutoModsPick',
          description: `For ${modsStats.autoModsPick.timesFailed} sets, it's not possible to pick stat mods to hit requested stat tiers.`,
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
            unpinItemsSuggestion(),
          ]),
        });
      }

      if (modsStats.finalAssignment.modAssignmentAttempted > 0) {
        // We made it to mod assignment, but didn't end up successfully. Definitely worth pointing out.
        problems.push({
          id: 'cantSlotMods',
          description: `${modsStats.finalAssignment.modAssignmentAttempted} sets could not fit all requested mods.`,
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
            modsStats.finalAssignment.autoModsAssignmentFailed > 0 && {
              id: 'hint2',
              contents: <i key="hint">Consider reducing stat minimums.</i>,
            },
            unpinItemsSuggestion(),
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
