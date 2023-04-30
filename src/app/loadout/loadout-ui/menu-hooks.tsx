import { LoadoutSort } from '@destinyitemmanager/dim-api-types';
import { AlertIcon } from 'app/dim-ui/AlertIcon';
import ColorDestinySymbols from 'app/dim-ui/destiny-symbols/ColorDestinySymbols';
import FilterPills, { Option } from 'app/dim-ui/FilterPills';
import { DimLanguage } from 'app/i18n';
import { t } from 'app/i18next-t';
import { getHashtagsFromNote } from 'app/inventory/note-hashtags';
import { isInGameLoadout, Loadout } from 'app/loadout-drawer/loadout-types';
import { isMissingItemsSelector } from 'app/loadout-drawer/loadout-utils';
import { loadoutsSelector } from 'app/loadout-drawer/loadouts-selector';
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
    () => filterLoadoutsToClass(allSavedLoadouts, classType),
    [allSavedLoadouts, classType]
  );
}

export function filterLoadoutsToClass(loadouts: Loadout[], classType: DestinyClass) {
  return loadouts.filter(
    (loadout) =>
      classType === DestinyClass.Unknown ||
      loadout.classType === DestinyClass.Unknown ||
      loadout.classType === classType
  );
}

/**
 * Set up the filter pills for loadouts - allowing for filtering by hashtag and some other special properties.
 * This returns a component ready to be used in the React tree as well as the list of filtered loadouts.
 */
export function useLoadoutFilterPills(
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
  if (!$featureFlags.loadoutFilterPills) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useMemo(() => [savedLoadouts, null, false], [savedLoadouts]);
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const isMissingItems = useSelector(isMissingItemsSelector);
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
        (loadoutsByHashtag[hashtag.replace(/_/g, ' ')] ??= []).push(loadout);
      }
    }
    return loadoutsByHashtag;
  }, [savedLoadouts]);

  const filterOptions = _.sortBy(
    Object.keys(loadoutsByHashtag).map(
      (hashtag): Option => ({
        key: hashtag,
        content: <ColorDestinySymbols text={hashtag.replace(/#(\w+\|)?/, '')} />,
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
        : savedLoadouts,
    [
      savedLoadouts,
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
