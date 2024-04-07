import { LoadoutSort } from '@destinyitemmanager/dim-api-types';
import { bungieBackgroundStyleAdvanced } from 'app/dim-ui/BungieImage';
import FilterPills, { Option } from 'app/dim-ui/FilterPills';
import ColorDestinySymbols from 'app/dim-ui/destiny-symbols/ColorDestinySymbols';
import { DimLanguage } from 'app/i18n';
import { t, tl } from 'app/i18next-t';
import { getHashtagsFromNote } from 'app/inventory/note-hashtags';
import { DimStore } from 'app/inventory/store-types';
import { findingDisplays } from 'app/loadout-analyzer/finding-display';
import { useSummaryLoadoutsAnalysis } from 'app/loadout-analyzer/hooks';
import { LoadoutAnalysisSummary, LoadoutFinding } from 'app/loadout-analyzer/types';
import { Loadout } from 'app/loadout-drawer/loadout-types';
import { isArmorModsOnly, isFashionOnly } from 'app/loadout-drawer/loadout-utils';
import { useD2Definitions } from 'app/manifest/selectors';
import { DEFAULT_ORNAMENTS } from 'app/search/d2-known-values';
import { faCheckCircle, refreshIcon } from 'app/shell/icons';
import AppIcon from 'app/shell/icons/AppIcon';
import { compareBy } from 'app/utils/comparators';
import { emptyArray } from 'app/utils/empty';
import { localizedIncludes, localizedSorter } from 'app/utils/intl';
import clsx from 'clsx';
import modificationsIcon from 'destiny-icons/general/modifications.svg';
import _ from 'lodash';
import { useEffect, useMemo, useState } from 'react';
import styles from './menu-hooks.m.scss';

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
  } = {},
): [filteredLoadouts: Loadout[], filterPillsElement: React.ReactNode, hasSelectedFilters: boolean] {
  if (!$featureFlags.loadoutFilterPills) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useMemo(() => [savedLoadouts, null, false], [savedLoadouts]);
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useLoadoutFilterPillsInternal(savedLoadouts, store, options);
}

const loadoutSpecializations = [tl('Loadouts.FashionOnly'), tl('Loadouts.ModsOnly')] as const;
type LoadoutSpecialization = (typeof loadoutSpecializations)[number];
type FilterPillType =
  | {
      tag: 'hashtag';
      hashtag: string;
    }
  | {
      tag: 'loadout-type';
      type: LoadoutSpecialization;
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
  } = {},
): [filteredLoadouts: Loadout[], filterPillsElement: React.ReactNode, hasSelectedFilters: boolean] {
  const [selectedFilters, setSelectedFilters] = useState<Option<FilterPillType>[]>(emptyArray());
  const defs = useD2Definitions();
  const analysisSummary = useSummaryLoadoutsAnalysis(
    savedLoadouts,
    store,
    Boolean(includeWarningPills),
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
    (o) => o.key,
  );

  const loadoutsByType = useMemo(() => {
    const loadoutsByType: Record<LoadoutSpecialization, Loadout[]> | undefined = defs && {
      'Loadouts.FashionOnly': savedLoadouts.filter((l) => isFashionOnly(defs, l)),
      'Loadouts.ModsOnly': savedLoadouts.filter((l) => isArmorModsOnly(defs, l)),
    };
    return loadoutsByType;
  }, [defs, savedLoadouts]);
  if (loadoutsByType) {
    for (const k of loadoutSpecializations) {
      filterOptions.push({
        key: k,
        value: { tag: 'loadout-type', type: k },
        content: (
          <>
            {k === 'Loadouts.ModsOnly' ? (
              <ModificationsIcon className="" />
            ) : (
              <FashionIcon className="" />
            )}
            {t(k)}
            {` (${loadoutsByType[k].length})`}
          </>
        ),
      });
    }
  }

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
                case 'loadout-type': {
                  return loadoutsByType?.[f.value.type] ?? [];
                }
                case 'finding': {
                  const loadouts = analysisSummary?.loadoutsByFindings[f.value.finding];
                  return loadouts?.size
                    ? [...savedLoadouts].filter((loadout) => loadouts?.has(loadout.id))
                    : savedLoadouts;
                }
              }
            }),
          )
        : savedLoadouts,
    [
      selectedFilters,
      savedLoadouts,
      loadoutsByHashtag,
      analysisSummary?.loadoutsByFindings,
      loadoutsByType,
    ],
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
  return (
    <div className={clsx(className, styles.analyzingText)}>
      {busy ? (
        <>
          <AppIcon icon={refreshIcon} spinning />
          {t('LoadoutAnalysis.Analyzing', { numAnalyzed, numLoadouts })}
        </>
      ) : (
        <>
          <AppIcon icon={faCheckCircle} />
          {t('LoadoutAnalysis.Analyzed', { numLoadouts })}
        </>
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
  loadoutSort: LoadoutSort,
) {
  let filteredLoadouts: Loadout[];
  if (query.length) {
    const includes = localizedIncludes(language, query);
    filteredLoadouts = loadouts.filter(
      (loadout) => includes(loadout.name) || (loadout.notes && includes(loadout.notes)),
    );
  } else {
    filteredLoadouts = [...loadouts];
  }

  return filteredLoadouts.sort(
    loadoutSort === LoadoutSort.ByEditTime
      ? compareBy((l) => -(l.lastUpdatedAt ?? 0))
      : localizedSorter(language, (l) => l.name),
  );
}

export function FashionIcon({ className }: { className: string }) {
  const defs = useD2Definitions();
  return (
    defs && (
      <div
        className={clsx(className, styles.fashionIcon)}
        style={bungieBackgroundStyleAdvanced(
          defs.InventoryItem.get(DEFAULT_ORNAMENTS[2])?.displayProperties.icon,
          undefined,
          2,
        )}
      />
    )
  );
}
export function ModificationsIcon({ className }: { className: string }) {
  return <img className={clsx(className, styles.modificationIcon)} src={modificationsIcon} />;
}
