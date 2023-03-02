import { LoadoutSort } from '@destinyitemmanager/dim-api-types';
import { AlertIcon } from 'app/dim-ui/AlertIcon';
import ColorDestinySymbols from 'app/dim-ui/destiny-symbols/ColorDestinySymbols';
import FilterPills, { Option } from 'app/dim-ui/FilterPills';
import { t } from 'app/i18next-t';
import { getHashtagsFromNote } from 'app/inventory/note-hashtags';
import { InGameLoadout, isInGameLoadout, Loadout } from 'app/loadout-drawer/loadout-types';
import { isMissingItemsSelector } from 'app/loadout-drawer/loadout-utils';
import { loadoutsSelector } from 'app/loadout-drawer/selectors';
import { plainString } from 'app/search/search-filters/freeform';
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
    () =>
      allSavedLoadouts.filter(
        (loadout) =>
          classType === DestinyClass.Unknown ||
          loadout.classType === DestinyClass.Unknown ||
          loadout.classType === classType
      ),
    [allSavedLoadouts, classType]
  );
}

/**
 * Set up the filter pills for loadouts - allowing for filtering by hashtag and some other special properties.
 * This returns a component ready to be used in the React tree as well as the list of filtered loadouts.
 */
export function useLoadoutFilterPills(
  savedLoadouts: Loadout[],
  inGameLoadouts: InGameLoadout[] | undefined,
  selectedStoreId: string,
  includeWarningPills: boolean,
  className?: string,
  darkBackground?: boolean,
  extra?: React.ReactNode
): [
  filteredLoadouts: (Loadout | InGameLoadout)[],
  filterPillsElement: React.ReactNode,
  hasSelectedFilters: boolean
] {
  if (!$featureFlags.loadoutFilterPills) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useMemo(
      () => [[...(inGameLoadouts ?? []), ...savedLoadouts], null, false],
      [inGameLoadouts, savedLoadouts]
    );
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const isMissingItems = useSelector(isMissingItemsSelector);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [selectedFilters, setSelectedFilters] = useState<Option[]>([]);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const loadoutsByHashtag = useMemo(() => {
    const loadoutsByHashtag: { [hashtag: string]: (Loadout | InGameLoadout)[] } = {};
    for (const loadout of savedLoadouts) {
      const hashtags = [
        ...getHashtagsFromNote(loadout.name),
        ...getHashtagsFromNote(loadout.notes),
      ];
      for (const hashtag of hashtags) {
        (loadoutsByHashtag[hashtag] ??= []).push(loadout);
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
                default:
                  return loadoutsByHashtag[f.key] ?? [];
              }
            })
          )
        : [...(inGameLoadouts ?? []), ...savedLoadouts],
    [
      savedLoadouts,
      inGameLoadouts,
      loadoutsByHashtag,
      loadoutsWithDeprecatedMods,
      loadoutsWithMissingItems,
      selectedFilters,
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
  loadouts: (Loadout | InGameLoadout)[],
  query: string,
  language: string,
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
      : (l) => l.name.toLocaleUpperCase()
  );
}
