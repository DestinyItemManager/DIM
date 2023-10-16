import { LoadoutSort } from '@destinyitemmanager/dim-api-types';
import { AlertIcon } from 'app/dim-ui/AlertIcon';
import ColorDestinySymbols from 'app/dim-ui/destiny-symbols/ColorDestinySymbols';
import FilterPills, { Option } from 'app/dim-ui/FilterPills';
import { DimLanguage } from 'app/i18n';
import { t } from 'app/i18next-t';
import { getHashtagsFromNote } from 'app/inventory/note-hashtags';
import { Loadout } from 'app/loadout-drawer/loadout-types';
import { loadoutIssuesSelector } from 'app/loadout-drawer/loadouts-selector';
import { compareBy } from 'app/utils/comparators';
import { emptyArray } from 'app/utils/empty';
import { localizedIncludes, localizedSorter } from 'app/utils/intl';
import _ from 'lodash';
import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

/**
 * Set up the filter pills for loadouts - allowing for filtering by hashtag and some other special properties.
 * This returns a component ready to be used in the React tree as well as the list of filtered loadouts.
 */
export function useLoadoutFilterPills(
  savedLoadouts: Loadout[],
  selectedStoreId: string,
  options: {
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
  return useLoadoutFilterPillsInternal(savedLoadouts, selectedStoreId, options);
}

function useLoadoutFilterPillsInternal(
  savedLoadouts: Loadout[],
  selectedStoreId: string,
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
  const loadoutIssues = useSelector(loadoutIssuesSelector);
  const [selectedFilters, setSelectedFilters] = useState<Option[]>(emptyArray());

  // Reset filters on character change
  useEffect(() => {
    setSelectedFilters(emptyArray());
  }, [selectedStoreId]);

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

  const loadoutsWithMissingItems = savedLoadouts.filter(
    (l) => loadoutIssues[l.id]?.hasMissingItems
  );
  const loadoutsWithDeprecatedMods = savedLoadouts.filter(
    (l) => loadoutIssues[l.id]?.hasDeprecatedMods
  );
  const loadoutsWithEmptyFragmentSlots = savedLoadouts.filter(
    (l) => loadoutIssues[l.id]?.emptyFragmentSlots
  );
  const loadoutsWithTooManyFragments = savedLoadouts.filter(
    (l) => loadoutIssues[l.id]?.tooManyFragments
  );

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
  loadouts: Loadout[],
  query: string,
  language: DimLanguage,
  loadoutSort: LoadoutSort
) {
  let filteredLoadouts: Loadout[];
  if (query.length) {
    const includes = localizedIncludes(language, query);
    filteredLoadouts = loadouts.filter(
      (loadout) => includes(loadout.name) || (loadout.notes && includes(loadout.notes))
    );
  } else {
    filteredLoadouts = [...loadouts];
  }

  return filteredLoadouts.sort(
    loadoutSort === LoadoutSort.ByEditTime
      ? compareBy((l) => -(l.lastUpdatedAt ?? 0))
      : localizedSorter(language, (l) => l.name)
  );
}
