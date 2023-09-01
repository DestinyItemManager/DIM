import { LoadoutSort } from '@destinyitemmanager/dim-api-types';
import { AlertIcon } from 'app/dim-ui/AlertIcon';
import ColorDestinySymbols from 'app/dim-ui/destiny-symbols/ColorDestinySymbols';
import FilterPills, { Option } from 'app/dim-ui/FilterPills';
import { DimLanguage } from 'app/i18n';
import { t } from 'app/i18next-t';
import { getHashtagsFromNote } from 'app/inventory/note-hashtags';
import { isInGameLoadout, Loadout } from 'app/loadout-drawer/loadout-types';
import {
  FragmentProblem,
  getFragmentProblemsSelector,
  isMissingItemsSelector,
} from 'app/loadout-drawer/loadout-utils';
import { loadoutsSelector } from 'app/loadout-drawer/loadouts-selector';
import { plainString } from 'app/search/search-filters/freeform';
import { isClassCompatible } from 'app/utils/item-utils';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import deprecatedMods from 'data/d2/deprecated-mods.json';
import _ from 'lodash';
import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

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

export interface LoadoutAndIssues {
  loadout: Loadout;
  hasMissingItems?: boolean;
  hasDeprecatedMods?: boolean;
  emptyFragmentSlots?: boolean;
  tooManyFragments?: boolean;
}

/**
 * Get the saved loadouts that apply to the given store, alongside applicable warning flags
 */
export function useSavedLoadoutsAndIssuesForStore(
  classType: DestinyClass,
  selectedStoreId: string
): LoadoutAndIssues[] {
  const savedLoadoutsThisClass = useSavedLoadoutsForClassType(classType);
  const getFragmentProblems = useSelector(getFragmentProblemsSelector);
  const isMissingItems = useSelector(isMissingItemsSelector);

  return useMemo(
    () =>
      savedLoadoutsThisClass.map((loadout) => {
        const hasMissingItems = isMissingItems(selectedStoreId, loadout);
        const hasDeprecatedMods = Boolean(
          loadout.parameters?.mods?.some((modHash) => deprecatedMods.includes(modHash))
        );

        const fragmentProblem = getFragmentProblems(selectedStoreId, loadout);
        const emptyFragmentSlots = fragmentProblem === FragmentProblem.EmptyFragmentSlots;
        const tooManyFragments = fragmentProblem === FragmentProblem.TooManyFragments;

        return {
          loadout,
          hasMissingItems,
          hasDeprecatedMods,
          emptyFragmentSlots,
          tooManyFragments,
        };
      }),
    [getFragmentProblems, isMissingItems, savedLoadoutsThisClass, selectedStoreId]
  );
}

export function filterLoadoutsToClass(loadouts: Loadout[], classType: DestinyClass) {
  return loadouts.filter((loadout) => isClassCompatible(classType, loadout.classType));
}

/**
 * Set up the filter pills for loadouts - allowing for filtering by hashtag and some other special properties.
 * This returns a component ready to be used in the React tree as well as the list of filtered loadouts.
 */
export function useLoadoutFilterPills(
  savedLoadouts: LoadoutAndIssues[],
  options: {
    includeWarningPills?: boolean;
    className?: string;
    darkBackground?: boolean;
    extra?: React.ReactNode;
  } = {}
): [
  filteredLoadouts: LoadoutAndIssues[],
  filterPillsElement: React.ReactNode,
  hasSelectedFilters: boolean,
] {
  if (!$featureFlags.loadoutFilterPills) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useMemo(() => [savedLoadouts, null, false], [savedLoadouts]);
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useLoadoutFilterPillsInternal(savedLoadouts, options);
}

function useLoadoutFilterPillsInternal(
  savedLoadouts: LoadoutAndIssues[],
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
): [
  filteredLoadouts: LoadoutAndIssues[],
  filterPillsElement: React.ReactNode,
  hasSelectedFilters: boolean,
] {
  const [selectedFilters, setSelectedFilters] = useState<Option[]>([]);

  const loadoutsByHashtag = useMemo(() => {
    const loadoutsByHashtag: { [hashtag: string]: LoadoutAndIssues[] } = {};
    for (const loadoutMeta of savedLoadouts) {
      const hashtags = [
        ...getHashtagsFromNote(loadoutMeta.loadout.name),
        ...getHashtagsFromNote(loadoutMeta.loadout.notes),
      ];
      for (const hashtag of hashtags) {
        (loadoutsByHashtag[hashtag.replace('#', '').replace(/_/g, ' ')] ??= []).push(loadoutMeta);
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

  const loadoutsWithMissingItems = savedLoadouts.filter((l) => l.hasMissingItems);
  const loadoutsWithDeprecatedMods = savedLoadouts.filter((l) => l.hasDeprecatedMods);
  const loadoutsWithEmptyFragmentSlots = savedLoadouts.filter((l) => l.emptyFragmentSlots);
  const loadoutsWithTooManyFragments = savedLoadouts.filter((l) => l.tooManyFragments);

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
  loadoutMetas: LoadoutAndIssues[],
  query: string,
  language: DimLanguage,
  loadoutSort: LoadoutSort
) {
  const loadoutQueryPlain = plainString(query, language);
  const filtered = loadoutMetas.filter(
    ({ loadout }) =>
      !query ||
      plainString(loadout.name, language).includes(loadoutQueryPlain) ||
      (!isInGameLoadout(loadout) &&
        loadout.notes &&
        plainString(loadout.notes, language).includes(loadoutQueryPlain))
  );
  return _.sortBy(
    filtered,
    // in-game are always first. is this still relevant anywhere?
    // IGLs are handled very differently anywhere they're filtered & sorted
    ({ loadout: l }) => (isInGameLoadout(l) ? 0 : 1),
    loadoutSort === LoadoutSort.ByEditTime
      ? ({ loadout: l }) => (isInGameLoadout(l) ? l.index : -(l.lastUpdatedAt ?? 0))
      : ({ loadout: l }) => (isInGameLoadout(l) ? l.index : l.name.toLocaleUpperCase())
  );
}
