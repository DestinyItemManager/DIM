import { LoadoutSort } from '@destinyitemmanager/dim-api-types';
import ColorDestinySymbols from 'app/dim-ui/destiny-symbols/ColorDestinySymbols';
import FilterPills, { Option } from 'app/dim-ui/FilterPills';
import { DimLanguage } from 'app/i18n';
import { t } from 'app/i18next-t';
import { getHashtagsFromNote } from 'app/inventory/note-hashtags';
import { DimStore } from 'app/inventory/store-types';
import { findingDisplays } from 'app/loadout-analyzer/finding-display';
import { useSummaryLoadoutsAnalysis } from 'app/loadout-analyzer/hooks';
import { LoadoutAnalysisSummary, LoadoutFinding } from 'app/loadout-analyzer/types';
import { Loadout } from 'app/loadout-drawer/loadout-types';
import { refreshIcon } from 'app/shell/icons';
import AppIcon from 'app/shell/icons/AppIcon';
import { compareBy } from 'app/utils/comparators';
import { emptyArray } from 'app/utils/empty';
import { localizedIncludes, localizedSorter } from 'app/utils/intl';
import _ from 'lodash';
import { useEffect, useMemo, useState } from 'react';

/**
 * Set up the filter pills for loadouts - allowing for filtering by hashtag and some other special properties.
 * This returns a component ready to be used in the React tree as well as the list of filtered loadouts.
 */
export function useLoadoutFilterPills(
  savedLoadouts: Loadout[],
  store: DimStore,
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
  return useLoadoutFilterPillsInternal(savedLoadouts, store, options);
}

type FilterPillType =
  | {
      tag: 'hashtag';
      hashtag: string;
    }
  | { tag: 'finding'; finding: LoadoutFinding };

function useLoadoutFilterPillsInternal(
  savedLoadouts: Loadout[],
  store: DimStore,
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
  const [selectedFilters, setSelectedFilters] = useState<Option<FilterPillType>[]>(emptyArray());
  const analysisSummary = useSummaryLoadoutsAnalysis(
    savedLoadouts,
    store,
    Boolean(includeWarningPills)
  );

  // Reset filters on character change
  useEffect(() => {
    setSelectedFilters(emptyArray());
  }, [store.id]);

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

  const filterOptions: Option<FilterPillType>[] = _.sortBy(
    Object.entries(loadoutsByHashtag).map(([hashtag, loadouts]) => ({
      key: hashtag,
      value: { tag: 'hashtag', hashtag },
      content: (
        <>
          <ColorDestinySymbols text={hashtag} />
          {` (${loadouts.length})`}
        </>
      ),
    })),
    (o) => o.key
  );

  if (analysisSummary) {
    for (const [finding_, affectedLoadouts] of Object.entries(analysisSummary.loadoutsByFindings)) {
      if (affectedLoadouts.size > 0) {
        const finding = parseInt(finding_, 10) as LoadoutFinding;
        const display = findingDisplays[finding];
        if (!display.icon) {
          continue;
        }
        filterOptions.push({
          key: `finding-${finding_}`,
          value: { tag: 'finding', finding },
          content: (
            <>
              <AppIcon icon={display.icon} />
              {t(display.name)}
              {` (${affectedLoadouts.size})`}
            </>
          ),
        });
      }
    }
  }

  const filteredLoadouts = useMemo(
    () =>
      selectedFilters.length > 0
        ? _.intersection(
            ...selectedFilters.map((f) => {
              switch (f.value.tag) {
                case 'hashtag': {
                  return loadoutsByHashtag[f.value.hashtag] ?? [];
                }
                case 'finding': {
                  const loadouts = analysisSummary?.loadoutsByFindings[f.value.finding];
                  return loadouts?.size
                    ? [...savedLoadouts].filter((loadout) => loadouts?.has(loadout.id))
                    : savedLoadouts;
                }
              }
            })
          )
        : savedLoadouts,
    [selectedFilters, savedLoadouts, loadoutsByHashtag, analysisSummary?.loadoutsByFindings]
  );

  const pills =
    filterOptions.length > 0 ? (
      <FilterPills
        options={filterOptions}
        selectedOptions={selectedFilters}
        onOptionsSelected={setSelectedFilters}
        className={className}
        darkBackground={darkBackground}
        extra={_.isEmpty(loadoutsByHashtag) ? extra : undefined}
      />
    ) : null;

  const analysisProgress = (
    <AnalysisProgress
      active={includeWarningPills}
      numLoadouts={savedLoadouts.length}
      summary={analysisSummary}
      className={className}
    />
  );

  return [
    filteredLoadouts,
    // eslint-disable-next-line react/jsx-key
    <>
      {pills}
      {analysisProgress}
    </>,
    selectedFilters.length > 0,
  ];
}

function AnalysisProgress({
  active,
  numLoadouts,
  summary,
  className,
}: {
  active: boolean | undefined;
  numLoadouts: number;
  summary: LoadoutAnalysisSummary | undefined;
  className?: string;
}) {
  if (!active) {
    return null;
  }

  const numAnalyzed = summary?.analyzedLoadouts ?? 0;
  const busy = numAnalyzed < numLoadouts || summary?.outdated;
  // FIXME className is awkward
  return (
    <div className={className}>
      {busy ? (
        <>
          <AppIcon icon={refreshIcon} spinning />
          {t('LoadoutAnalysis.Analyzing', { numAnalyzed, numLoadouts })}
        </>
      ) : (
        t('LoadoutAnalysis.Analyzed', { numLoadouts })
      )}
    </div>
  );
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
