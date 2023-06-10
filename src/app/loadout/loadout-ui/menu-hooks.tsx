import { LoadoutSort } from '@destinyitemmanager/dim-api-types';
import { AlertIcon } from 'app/dim-ui/AlertIcon';
import FilterPills, { Option } from 'app/dim-ui/FilterPills';
import ColorDestinySymbols from 'app/dim-ui/destiny-symbols/ColorDestinySymbols';
import { DimLanguage } from 'app/i18n';
import { t } from 'app/i18next-t';
import { getHashtagsFromNote } from 'app/inventory/note-hashtags';
import { AutoOptimizationReport, AutoOptimizationResult } from 'app/loadout-builder/auto-optimizer';
import { Loadout, isInGameLoadout } from 'app/loadout-drawer/loadout-types';
import {
  FragmentProblem,
  getFragmentProblemsSelector,
  isMissingItemsSelector,
} from 'app/loadout-drawer/loadout-utils';
import { loadoutsSelector } from 'app/loadout-drawer/loadouts-selector';
import { plainString } from 'app/search/search-filters/freeform';
import { emptyArray } from 'app/utils/empty';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import deprecatedMods from 'data/d2/deprecated-mods.json';
import _ from 'lodash';
import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { filterLoadoutsToClass } from './utils';

/**
 * Get the saved loadouts that apply to the given class type, out of all saved loadouts.
 */
export function useSavedLoadoutsForClassType(classType: DestinyClass) {
  const allSavedLoadouts = useSelector(loadoutsSelector);
  return useMemo(
    () => filterLoadoutsToClass(allSavedLoadouts, classType),
    [allSavedLoadouts, classType]
  );
}

/**
 * Set up the filter pills for loadouts - allowing for filtering by hashtag and some other special properties.
 * This returns a component ready to be used in the React tree as well as the list of filtered loadouts.
 */
export function useLoadoutFilterPills(
  savedLoadouts: Loadout[],
  selectedStoreId: string,
  autoUpgradeResults: AutoOptimizationReport | undefined,
  {
    includeWarningPills,
    className,
    darkBackground,
    extra,
  }: {
    includeWarningPills?: boolean;
    className?: string;
    darkBackground?: boolean;
    extra?: React.ReactNode;
  } = {}
): [filteredLoadouts: Loadout[], filterPillsElement: React.ReactNode, hasSelectedFilters: boolean] {
  if (!$featureFlags.loadoutFilterPills) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useMemo(() => [savedLoadouts, null, false], [savedLoadouts]);
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const isMissingItems = useSelector(isMissingItemsSelector);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const getFragmentProblems = useSelector(getFragmentProblemsSelector);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [selectedFilters, setSelectedFilters] = useState<Option[]>([]);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const loadoutsByHashtag = useMemo(() => {
    const loadoutsByHashtag: { [hashtag: string]: Loadout[] } = {};
    for (const loadout of savedLoadouts) {
      const hashtags = [
        ...getHashtagsFromNote(loadout.name),
        ...getHashtagsFromNote(loadout.notes),
      ];
      for (const hashtag of hashtags) {
        (loadoutsByHashtag[hashtag.replace('#', '').replace(/_/g, ' ')] ??= []).push(loadout);
      }
    }
    return loadoutsByHashtag;
  }, [savedLoadouts]);

  const filterOptions = _.sortBy(
    Object.keys(loadoutsByHashtag).map(
      (hashtag): Option => ({
        key: hashtag,
        content: <ColorDestinySymbols text={hashtag} />,
      })
    ),
    (o) => o.key
  );

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const loadoutsWithMissingItems = useMemo(
    () => savedLoadouts.filter((loadout) => isMissingItems(selectedStoreId, loadout)),
    [isMissingItems, savedLoadouts, selectedStoreId]
  );
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const loadoutsWithDeprecatedMods = useMemo(
    () =>
      savedLoadouts.filter((loadout) =>
        loadout.parameters?.mods?.some((modHash) => deprecatedMods.includes(modHash))
      ),
    [savedLoadouts]
  );

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [loadoutsWithEmptyFragmentSlots, loadoutsWithTooManyFragments] = useMemo(() => {
    const problematicLoadouts = _.groupBy(savedLoadouts, (loadout) =>
      getFragmentProblems(selectedStoreId, loadout)
    );
    return [
      problematicLoadouts[FragmentProblem.EmptyFragmentSlots] ?? emptyArray(),
      problematicLoadouts[FragmentProblem.TooManyFragments] ?? emptyArray(),
    ] as const;
  }, [getFragmentProblems, savedLoadouts, selectedStoreId]);

  if (autoUpgradeResults) {
    const results = Object.values(autoUpgradeResults);

    if (
      results.some(
        (result) =>
          result.tag === 'finished' && result.result === AutoOptimizationResult.StrongBetterSet
      )
    ) {
      filterOptions.push({
        key: 'strongUpgrades',
        content: (
          <>
            <AlertIcon /> Strong Upgrades
          </>
        ),
      });
    }

    if (
      results.some(
        (result) =>
          result.tag === 'finished' && result.result === AutoOptimizationResult.WeakBetterSet
      )
    ) {
      filterOptions.push({
        key: 'weakUpgrades',
        content: (
          <>
            <AlertIcon /> Weak Upgrades
          </>
        ),
      });
    }
  }

  if (includeWarningPills) {
    if (loadoutsWithMissingItems.length) {
      filterOptions.push({
        key: 'missingitems',
        content: (
          <>
            <AlertIcon /> {t('Loadouts.MissingItems')}
          </>
        ),
      });
    }

    if (loadoutsWithDeprecatedMods.length) {
      filterOptions.push({
        key: 'deprecated',
        content: (
          <>
            <AlertIcon /> {t('Loadouts.DeprecatedMods')}
          </>
        ),
      });
    }

    if (loadoutsWithEmptyFragmentSlots.length) {
      filterOptions.push({
        key: 'emptyFragmentSlots',
        content: (
          <>
            <AlertIcon /> {t('Loadouts.EmptyFragmentSlots')}
          </>
        ),
      });
    }
    if (loadoutsWithTooManyFragments.length) {
      filterOptions.push({
        key: 'tooManyFragments',
        content: (
          <>
            <AlertIcon /> {t('Loadouts.TooManyFragments')}
          </>
        ),
      });
    }
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const filteredLoadouts = useMemo(
    () =>
      selectedFilters.length > 0
        ? _.intersection(
            ...selectedFilters.map((f) => {
              switch (f.key) {
                case 'deprecated':
                  return loadoutsWithDeprecatedMods;
                case 'missingitems':
                  return loadoutsWithMissingItems;
                case 'emptyFragmentSlots':
                  return loadoutsWithEmptyFragmentSlots;
                case 'tooManyFragments':
                  return loadoutsWithTooManyFragments;
                case 'strongUpgrades':
                  return savedLoadouts.filter((l) => {
                    const result = autoUpgradeResults?.[l.id];
                    return (
                      result?.tag === 'finished' &&
                      result.result === AutoOptimizationResult.StrongBetterSet
                    );
                  });
                case 'weakUpgrades':
                  return savedLoadouts.filter((l) => {
                    const result = autoUpgradeResults?.[l.id];
                    return (
                      result?.tag === 'finished' &&
                      result.result === AutoOptimizationResult.WeakBetterSet
                    );
                  });
                default:
                  return loadoutsByHashtag[f.key] ?? [];
              }
            })
          )
        : savedLoadouts,
    [
      selectedFilters,
      savedLoadouts,
      loadoutsWithDeprecatedMods,
      loadoutsWithMissingItems,
      loadoutsWithEmptyFragmentSlots,
      loadoutsWithTooManyFragments,
      loadoutsByHashtag,
      autoUpgradeResults,
    ]
  );

  return [
    filteredLoadouts,
    filterOptions.length > 0 ? (
      <FilterPills
        options={filterOptions}
        selectedOptions={selectedFilters}
        onOptionsSelected={setSelectedFilters}
        className={className}
        darkBackground={darkBackground}
        extra={_.isEmpty(loadoutsByHashtag) ? extra : undefined}
      />
    ) : null,
    selectedFilters.length > 0,
  ];
}

/**
 * Apply the given query to loadouts, and sort them according to preference.
 */
export function searchAndSortLoadoutsByQuery(
  loadouts: Loadout[],
  query: string,
  language: DimLanguage,
  loadoutSort: LoadoutSort
) {
  const loadoutQueryPlain = plainString(query, language);
  return _.sortBy(
    loadouts.filter(
      (loadout) =>
        !query ||
        plainString(loadout.name, language).includes(loadoutQueryPlain) ||
        (!isInGameLoadout(loadout) &&
          loadout.notes &&
          plainString(loadout.notes, language).includes(loadoutQueryPlain))
    ),
    (l) => (isInGameLoadout(l) ? 0 : 1),
    loadoutSort === LoadoutSort.ByEditTime
      ? (l) => (isInGameLoadout(l) ? l.index : -(l.lastUpdatedAt ?? 0))
      : (l) => (isInGameLoadout(l) ? l.index : l.name.toLocaleUpperCase())
  );
}
