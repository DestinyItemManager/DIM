import { AssumeArmorMasterwork, LockArmorEnergyType } from '@destinyitemmanager/dim-api-types';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { AlertIcon } from 'app/dim-ui/AlertIcon';
import { t } from 'app/i18next-t';
import { PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import PlugDef from 'app/loadout/loadout-ui/PlugDef';
import { ModMap } from 'app/loadout/mod-assignment-utils';
import { AppIcon, banIcon } from 'app/shell/icons';
import { uniqBy } from 'app/utils/util';
import { DestinyEnergyType } from 'bungie-api-ts/destiny2';
import _ from 'lodash';
import { Dispatch } from 'react';
import ExoticArmorChoice from './filter/ExoticArmorChoice';
import LockedItem from './filter/LockedItem';
import { FilterInfo } from './item-filter';
import { LoadoutBuilderAction } from './loadout-builder-reducer';
import styles from './NoBuildsFoundExplainer.m.scss';
import { ProcessStatistics, RejectionRate } from './process-worker/types';
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

export default function NoBuildsFoundExplainer({
  defs,
  dispatch,
  autoAssignStatMods,
  lockedModMap,
  alwaysInvalidMods,
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
  lockedModMap: ModMap;
  alwaysInvalidMods: PluggableInventoryItemDefinition[];
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
  if (alwaysInvalidMods.length) {
    problems.push({
      id: 'alwaysInvalidMods',
      description: t('LoadoutBuilder.NoBuildsFoundExplainer.AlwaysInvalidMods'),
      suggestions: [
        {
          id: 'dropInvalidMods',
          contents: (
            <>
              <button
                key="removeAllInvalid"
                type="button"
                className="dim-button"
                onClick={() => dispatch({ type: 'removeLockedMods', mods: alwaysInvalidMods })}
              >
                <AppIcon icon={banIcon} /> {t('LoadoutBuilder.NoBuildsFoundExplainer.RemoveMods')}
              </button>
              {modRow(alwaysInvalidMods)}
            </>
          ),
        },
      ],
    });
  }

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
      const bucketMods = lockedModMap.bucketSpecificMods[bucketHash];
      if (bucketInfo.totalConsidered > 0 && bucketInfo.finalValid === 0 && bucketMods?.length) {
        failedModsInBucket = true;
        const suggestions: ActionableSuggestion[] = [
          {
            id: 'considerDroppingMods',
            contents: (
              <>
                {t('LoadoutBuilder.NoBuildsFoundExplainer.MaybeRemoveMods')}
                {modRow(bucketMods)}
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
                {t('LoadoutBuilder.NoBuildsFoundExplainer.MaybeAllowMoreItems')}
                <div className={styles.modRow}>
                  <LockedItem
                    lockedItem={pinnedItem}
                    onRemove={() => dispatch({ type: 'unpinItem', item: pinnedItem })}
                  />
                </div>
              </>
            ),
          });
        }

        if (bucketHash === lockedExoticBucketHash) {
          suggestions.push({
            id: 'considerRemovingExotic',
            contents: (
              <>
                {t('LoadoutBuilder.NoBuildsFoundExplainer.MaybeAllowMoreItems')}
                <div className={styles.modRow}>
                  <ExoticArmorChoice
                    lockedExoticHash={lockedExoticHash!}
                    onClose={() => dispatch({ type: 'removeLockedExotic' })}
                  />
                </div>
              </>
            ),
          });
        }

        problems.push({
          id: `badBucket-${bucketHash}`,
          description: t('LoadoutBuilder.NoBuildsFoundExplainer.BadSlot', {
            bucketName: defs.InventoryBucket[bucketHash].displayProperties.name,
          }),
          suggestions,
        });
      }
    }
  }

  // TODO: Maybe add a "trivially infeasible slot-independent mods" check?
  // E.g. if we have solar mods in helmet, arms and chest but have more than
  // two non-solar combat mods, mod assignment is trivially infeasible and we
  // can point that out directly?

  const anyStatMinimums = Object.values(statFilters).some((f) => !f.ignored && f.min > 0);

  const bucketIndependentMods = [
    ...lockedModMap.generalMods,
    ...lockedModMap.combatMods,
    ...lockedModMap.activityMods,
  ];

  const elementMayCauseProblems =
    armorEnergyRules.lockArmorEnergyType !== LockArmorEnergyType.None &&
    (processInfo?.statistics.modsStatistics.earlyModsCheck.timesFailed ||
      processInfo?.statistics.modsStatistics.finalAssignment.modsAssignmentFailed ||
      failedModsInBucket) &&
    lockedModMap.allMods.some(
      (mod) => mod.plug.energyCost && mod.plug.energyCost.energyType !== DestinyEnergyType.Any
    );
  const capacityMayCauseProblems =
    armorEnergyRules.assumeArmorMasterwork !== AssumeArmorMasterwork.All &&
    (processInfo?.statistics.modsStatistics.finalAssignment.modsAssignmentFailed ||
      processInfo?.statistics.modsStatistics.finalAssignment.autoModsAssignmentFailed ||
      failedModsInBucket) &&
    (lockedModMap.allMods.length || anyStatMinimums);

  if (
    (!alwaysInvalidMods || alwaysInvalidMods.length === 0) &&
    (elementMayCauseProblems || capacityMayCauseProblems)
  ) {
    // If we might have problems assigning bucket specific mods or mods in the
    // process worker, offer some advice.
    problems.push({
      id: 'armorEnergyRestrictions',
      description: t('LoadoutBuilder.NoBuildsFoundExplainer.AssumptionsRestricted'),
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
              {t('LoadoutBuilder.NoBuildsFoundExplainer.AssumeMasterworked')}
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
              {t('LoadoutBuilder.NoBuildsFoundExplainer.AssumeElementChange')}
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
        description: t('LoadoutBuilder.NoBuildsFoundExplainer.ActiveSearchQuery'),
        suggestions: [
          {
            id: 'clearQuery',
            contents: t('LoadoutBuilder.NoBuildsFoundExplainer.MaybeRemoveSearchQuery'),
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
              {t('LoadoutBuilder.NoBuildsFoundExplainer.MaybeAllowMoreItems')}
              {allPinnedItems.map((pinnedItem) => (
                <div key={pinnedItem.id} className={styles.modRow}>
                  <LockedItem
                    lockedItem={pinnedItem}
                    onRemove={() => dispatch({ type: 'unpinItem', item: pinnedItem })}
                  />
                </div>
              ))}
            </>
          ),
        }
      );
    };

    // Here, we check which parts of the worker process rejected a ton of sets. LO essentially
    // checks upper bounds, lower bounds, mod assignments in that order. We base our reports on the
    // percentage of sets that failed each of the steps. This is, statistically speaking, not really a good
    // way to do it because the "last" step that fails always fails 100% of the sets it sees (otherwise
    // it either wouldn't be the last step or we wouldn't be here). So if we have three filter steps A -> B -> C and no sets,
    // where A, B, C are the events that a set would independently pass A, B and C respectively,
    // we get approximations for P(!A), P(!B | A) (B failed given that A succeeded) and P(!C | B∩A) (similarly)
    // our numFailed/numChecked rate for C will be either 0/0 or result in P(!C | B∩A) = 1.
    // Say A is the upper bounds check, B is the lower bounds check, and C is mod assignment, then if A rejected 99.9% of sets
    // and left 1 set through, this set passed lower bounds, and then we failed to assign combat mods to that 1 set in step C,
    // then blaming the selected combat mods is kind of unfair even though 100% of sets failed C. So there's no perfect way to solve this,
    // we just have to make up percentages that work well.
    // As an aside, this particularly interesting when the steps aren't statistically independent -- e.g. if everything that
    // passes A fails C and everything that fails A would pass C.
    // This might happen with stat upper bounds -- non-masterworked armor tends to have lower stats, so may pass more upper bounds
    // checks, but also has less energy capacity for mods. So upper bounds should probably be warned about quite early and often.

    const isInteresting = ({ timesChecked, timesFailed }: RejectionRate, threshold: number) =>
      timesChecked > 0 && timesFailed / timesChecked >= threshold;

    const {
      lowerBoundsExceeded,
      upperBoundsExceeded,
      modsStatistics: modsStats,
    } = processInfo.statistics;

    if (isInteresting(upperBoundsExceeded, UPPER_STAT_BOUNDS_WARN_RATIO)) {
      problems.push({
        id: 'upperBoundsExceeded',
        description: t('LoadoutBuilder.NoBuildsFoundExplainer.UpperBoundsFailed'),
        suggestions: _.compact([
          {
            id: 'hint',
            contents: t('LoadoutBuilder.NoBuildsFoundExplainer.MaybeIncreaseUpperBounds'),
          },
          unpinItemsSuggestion(),
        ]),
      });
    }

    if (isInteresting(lowerBoundsExceeded, LOWER_STAT_BOUNDS_WARN_RATIO)) {
      problems.push({
        id: 'lowerBoundsExceeded',
        description: t('LoadoutBuilder.NoBuildsFoundExplainer.LowerBoundsFailed'),
        suggestions: _.compact([
          !autoAssignStatMods &&
            $featureFlags.loAutoStatMods && {
              id: 'hint1',
              contents: (
                <button
                  key="allowAutoStatMods"
                  type="button"
                  className="dim-button"
                  onClick={() =>
                    dispatch({
                      type: 'autoStatModsChanged',
                      autoStatMods: true,
                    })
                  }
                >
                  {t('LoadoutBuilder.NoBuildsFoundExplainer.AllowAutoStatMods')}
                </button>
              ),
            },
          {
            id: 'hint2',
            contents: t('LoadoutBuilder.NoBuildsFoundExplainer.MaybeDecreaseLowerBounds'),
          },
          unpinItemsSuggestion(),
        ]),
      });
    }

    if (modsStats.earlyModsCheck.timesChecked > 0) {
      // If we got here, we took a closer look at a number of sets, but failed to pick/assign mods.

      const suggestions: (ActionableSuggestion | false | undefined)[] = [];

      if (isInteresting(modsStats.earlyModsCheck, EARLY_MOD_REJECTION_WARN_RATIO)) {
        // Early mod rejection is armor elements / mod tags
        suggestions.push(
          (lockedModMap.combatMods.length > 0 || lockedModMap.activityMods.length > 0) && {
            id: 'removeElementOrTagMods',
            contents: (
              <>
                {t('LoadoutBuilder.NoBuildsFoundExplainer.MaybeRemoveMods')}
                {modRow([...lockedModMap.combatMods, ...lockedModMap.activityMods])}
              </>
            ),
          },
          unpinItemsSuggestion()
        );
      }

      if (isInteresting(modsStats.autoModsPick, LOWER_STAT_BOUNDS_WARN_RATIO)) {
        // We fail to pick stat mods to hit these stats very often, so consider
        // relaxing stat requirements and dropping general mods so min auto mods
        // has more freedom
        suggestions.push(
          lockedModMap.generalMods.length > 0 && {
            id: 'removeGeneralMods',
            contents: (
              <>
                {t('LoadoutBuilder.NoBuildsFoundExplainer.MaybeRemoveMods')}
                {modRow(lockedModMap.generalMods)}
              </>
            ),
          },
          {
            id: 'decreaseLowerBounds',
            contents: t('LoadoutBuilder.NoBuildsFoundExplainer.MaybeDecreaseLowerBounds'),
          },
          unpinItemsSuggestion()
        );
      }

      if (modsStats.finalAssignment.modAssignmentAttempted > 0) {
        // We made it to mod assignment, but didn't end up successfully. Definitely worth pointing out.
        suggestions.push(
          bucketIndependentMods.length > 0 && {
            id: 'removeBucketIndependentMods',
            contents: (
              <>
                {t('LoadoutBuilder.NoBuildsFoundExplainer.MaybeRemoveMods')}
                {modRow(bucketIndependentMods)}
              </>
            ),
          },
          modsStats.finalAssignment.autoModsAssignmentFailed > 0 && {
            id: 'decreaseLowerBounds',
            contents: t('LoadoutBuilder.NoBuildsFoundExplainer.MaybeDecreaseLowerBounds'),
          },
          unpinItemsSuggestion()
        );
      }
      problems.push({
        id: 'modAssignmentFailed',
        description: t('LoadoutBuilder.NoBuildsFoundExplainer.ModAssignmentFailed'),
        suggestions: uniqBy(_.compact(suggestions), ({ id }) => id),
      });
    }
  }

  return (
    <div className={styles.noBuildsExplainerContainer}>
      <h3 className={styles.noBuildsFoundMsg}>
        <AlertIcon />
        {t('LoadoutBuilder.NoBuildsFoundExplainer.Header')}
      </h3>
      {problems.length > 0 && (
        <ul>
          {problems.map((p) => (
            <li key={p.id}>
              <div className={styles.problemDescription}>
                <h3>{p.description}</h3>
                <ul className={styles.suggestionList}>
                  {p.suggestions.map((suggestion) => (
                    <li key={suggestion.id}>{suggestion.contents}</li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
