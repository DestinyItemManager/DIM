import { LoadoutSort } from '@destinyitemmanager/dim-api-types';
import { DestinyAccount } from 'app/accounts/destiny-account';
import { apiPermissionGrantedSelector, languageSelector } from 'app/dim-api/selectors';
import { AlertIcon } from 'app/dim-ui/AlertIcon';
import BungieImage from 'app/dim-ui/BungieImage';
import CharacterSelect from 'app/dim-ui/CharacterSelect';
import PageWithMenu from 'app/dim-ui/PageWithMenu';
import ShowPageLoading from 'app/dim-ui/ShowPageLoading';
import { VirtualListRef, WindowVirtualList } from 'app/dim-ui/VirtualList';
import ColorDestinySymbols from 'app/dim-ui/destiny-symbols/ColorDestinySymbols';
import { t, tl } from 'app/i18next-t';
import { artifactUnlocksSelector, sortedStoresSelector } from 'app/inventory/selectors';
import { useLoadStores } from 'app/inventory/store/hooks';
import {
  MakeLoadoutAnalysisAvailable,
  useUpdateLoadoutAnalysisContext,
} from 'app/loadout-analyzer/hooks';
import { editLoadout } from 'app/loadout-drawer/loadout-events';
import {
  getLoadoutSeason,
  newLoadout,
  newLoadoutFromEquipped,
} from 'app/loadout-drawer/loadout-utils';
import { InGameLoadout, Loadout } from 'app/loadout/loadout-types';
import { loadoutsForClassTypeSelector } from 'app/loadout/loadouts-selector';
import { selectedLoadoutStoreSelector } from 'app/loadout/selectors';
import { useD2Definitions } from 'app/manifest/selectors';
import { loadoutFilterFactorySelector } from 'app/search/loadouts/loadout-search-filter';
import { useSetting } from 'app/settings/hooks';
import { AppIcon, addIcon, faCalculator, uploadIcon } from 'app/shell/icons';
import { querySelector, useIsPhonePortrait } from 'app/shell/selectors';
import { usePageTitle } from 'app/utils/hooks';
import { DestinySeasonDefinition } from 'bungie-api-ts/destiny2';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useLocation } from 'react-router';
import * as styles from './Loadouts.m.scss';
import LoadoutRow from './LoadoutsRow';
import { updateLoadoutStore } from './actions';
import EditInGameLoadout from './ingame/EditInGameLoadout';
import { InGameLoadoutDetails } from './ingame/InGameLoadoutDetailsSheet';
import { InGameLoadoutStrip } from './ingame/InGameLoadoutStrip';
import LoadoutImportSheet from './loadout-share/LoadoutImportSheet';
import LoadoutShareSheet from './loadout-share/LoadoutShareSheet';
import { searchAndSortLoadoutsByQuery, useLoadoutFilterPills } from './loadout-ui/menu-hooks';

const sortOptions = [
  {
    key: 'time',
    content: tl('Loadouts.SortByEditTime'),
    value: LoadoutSort.ByEditTime,
  },
  {
    key: 'name',
    content: tl('Loadouts.SortByName'),
    value: LoadoutSort.ByName,
  },
];

/**
 * The Loadouts page is a toplevel page for loadout management. It also provides access to the Loadout Optimizer.
 *
 * This container just shows a loading page while stores are loading.
 */
export default function LoadoutsContainer({ account }: { account: DestinyAccount }) {
  const storesLoaded = useLoadStores(account);
  usePageTitle(t('Loadouts.Loadouts'));

  if (!storesLoaded) {
    return <ShowPageLoading message={t('Loading.Profile')} />;
  }

  // TODO: how high in our tree do we want this analyzer?
  return (
    <MakeLoadoutAnalysisAvailable>
      <Loadouts account={account} />
    </MakeLoadoutAnalysisAvailable>
  );
}

function Loadouts({ account }: { account: DestinyAccount }) {
  const dispatch = useDispatch();

  const stores = useSelector(sortedStoresSelector);
  const selectedStore = useSelector(selectedLoadoutStoreSelector);

  const setSelectedStoreId = useCallback(
    (storeId: string) => {
      dispatch(updateLoadoutStore({ storeId }));
    },
    [dispatch],
  );

  useEffect(
    () => () => {
      // Unset selected loadout on unmount so that the selection is not
      // remembered across page navigations.
      dispatch(updateLoadoutStore({ storeId: undefined }));
    },
    [dispatch],
  );

  const [sharedLoadout, setSharedLoadout] = useState<Loadout>();
  const [loadoutImportOpen, setLoadoutImportOpen] = useState<boolean>(false);
  const classType = selectedStore.classType;
  const isPhonePortrait = useIsPhonePortrait();
  const query = useSelector(querySelector);
  const [loadoutSort, setLoadoutSort] = useSetting('loadoutSort');
  const language = useSelector(languageSelector);
  const apiPermissionGranted = useSelector(apiPermissionGrantedSelector);

  const savedLoadouts = useSelector(loadoutsForClassTypeSelector(classType));
  const savedLoadoutIds = new Set(savedLoadouts.map((l) => l.id));

  const artifactUnlocks = useSelector(artifactUnlocksSelector(selectedStore.id));

  const currentLoadout = useMemo(
    () => newLoadoutFromEquipped(t('Loadouts.FromEquipped'), selectedStore, artifactUnlocks),
    [artifactUnlocks, selectedStore],
  );

  useUpdateLoadoutAnalysisContext(selectedStore.id);

  const [showSnapshot, setShowSnapshot] = useState(false);
  const handleSnapshot = useCallback(() => setShowSnapshot(true), [setShowSnapshot]);
  const handleSnapshotSheetClose = useCallback(() => setShowSnapshot(false), []);

  const [editingInGameLoadout, setEditingInGameLoadout] = useState<InGameLoadout>();
  const handleEditSheetClose = useCallback(() => setEditingInGameLoadout(undefined), []);

  const location = useLocation();
  const locationState = location.state as
    | {
        inGameLoadout: InGameLoadout;
      }
    | undefined;

  const [viewingInGameLoadout, setViewingInGameLoadout] = useState(locationState?.inGameLoadout);
  const handleViewingSheetClose = useCallback(() => setViewingInGameLoadout(undefined), []);

  const [filteredLoadouts, filterPills, hasSelectedFilters] = useLoadoutFilterPills(
    savedLoadouts,
    selectedStore,
    {
      includeWarningPills: true,
      extra: <span className={styles.hashtagTip}>{t('Loadouts.HashtagTip')}</span>,
    },
  );

  const filteringLoadouts = Boolean(query || hasSelectedFilters);

  const loadoutFilterFactory = useSelector(loadoutFilterFactorySelector);
  const loadouts = searchAndSortLoadoutsByQuery(
    filteredLoadouts,
    loadoutFilterFactory,
    query,
    language,
    loadoutSort,
  );
  if (!filteringLoadouts) {
    loadouts.unshift(currentLoadout);
  }

  const handleNewLoadout = () => {
    const loadout = newLoadout('', [], selectedStore.classType);
    editLoadout(loadout, selectedStore.id);
  };

  // Insert season headers if we're sorting by edit time
  const loadoutRows = useAddSeasonHeaders(loadouts, loadoutSort);

  const virtualListRef = useRef<VirtualListRef>(null);
  const scrollToLoadout = useCallback(
    (id: string) => {
      const index = loadouts.findIndex((l) => l.id === id);
      if (index >= 0) {
        virtualListRef.current?.scrollToIndex(index, { align: 'start' });
      }
    },
    [loadouts],
  );

  return (
    <PageWithMenu>
      <PageWithMenu.Menu className={styles.menu}>
        <CharacterSelect
          stores={stores}
          selectedStore={selectedStore}
          onCharacterChanged={setSelectedStoreId}
        />
        <div className={styles.menuButtons}>
          <select
            value={loadoutSort}
            onChange={(e) => setLoadoutSort(parseInt(e.target.value, 10))}
          >
            {sortOptions.map((option) => (
              <option key={option.key} value={option.value}>
                {t(option.content)}
              </option>
            ))}
          </select>
          <button type="button" className={styles.menuButton} onClick={handleNewLoadout}>
            <AppIcon icon={addIcon} /> <span>{t('Loadouts.Create')}</span>
          </button>
          <button
            type="button"
            className={styles.menuButton}
            onClick={() => setLoadoutImportOpen(true)}
          >
            <AppIcon icon={uploadIcon} /> <span>{t('Loadouts.ImportLoadout')}</span>
          </button>
          <Link
            className={styles.menuButton}
            to="../optimizer"
            state={{ storeId: selectedStore.id }}
          >
            <AppIcon icon={faCalculator} /> {t('LB.LB')}
          </Link>
        </div>
        {!isPhonePortrait &&
          loadouts.map((loadout) => (
            <PageWithMenu.MenuButton
              onClick={() => scrollToLoadout(loadout.id)}
              key={loadout.id}
              className={styles.menuLoadout}
            >
              <ColorDestinySymbols text={loadout.name} />
            </PageWithMenu.MenuButton>
          ))}
      </PageWithMenu.Menu>
      <PageWithMenu.Contents>
        {$featureFlags.warnNoSync && !apiPermissionGranted && (
          <p>
            <AlertIcon /> {t('Storage.DimSyncNotEnabled')}
          </p>
        )}
        <InGameLoadoutStrip
          store={selectedStore}
          onEdit={setEditingInGameLoadout}
          onShare={setSharedLoadout}
          onShowDetails={setViewingInGameLoadout}
        />
        <h2>{t('Loadouts.DimLoadouts')}</h2>
        {filterPills}
        <WindowVirtualList
          ref={virtualListRef}
          numElements={loadoutRows.length}
          itemContainerClassName={styles.loadoutRow}
          estimatedSize={(index) =>
            'id' in loadoutRows[index] ? (isPhonePortrait ? 1450 : 300) : 51
          }
          getItemKey={(index) => {
            const loadoutOrSeason = loadoutRows[index];
            return 'id' in loadoutOrSeason ? loadoutOrSeason.id : loadoutOrSeason.startDate!;
          }}
        >
          {(index) => {
            const loadoutOrSeason = loadoutRows[index];
            if ('id' in loadoutOrSeason) {
              const loadout = loadoutOrSeason;
              return (
                <LoadoutRow
                  loadout={loadout}
                  store={selectedStore}
                  saved={savedLoadoutIds.has(loadout.id)}
                  equippable={loadout !== currentLoadout}
                  onShare={setSharedLoadout}
                  onSnapshotInGameLoadout={handleSnapshot}
                />
              );
            } else {
              const season = loadoutOrSeason;
              return (
                <h3 className={styles.seasonHeader}>
                  {season.displayProperties.hasIcon && (
                    <BungieImage height={24} width={24} src={season.displayProperties.icon} />
                  )}{' '}
                  {season.displayProperties.name} -{' '}
                  {t('Loadouts.Season', {
                    season: season.seasonNumber,
                  })}
                </h3>
              );
            }
          }}
        </WindowVirtualList>
        {loadouts.length === 0 && <p>{t('Loadouts.NoneMatch', { query })}</p>}
      </PageWithMenu.Contents>
      {sharedLoadout && (
        <LoadoutShareSheet
          account={account}
          loadout={sharedLoadout}
          onClose={() => setSharedLoadout(undefined)}
        />
      )}
      {loadoutImportOpen && (
        <LoadoutImportSheet
          currentStoreId={selectedStore.id}
          onClose={() => setLoadoutImportOpen(false)}
        />
      )}
      {viewingInGameLoadout && (
        <InGameLoadoutDetails
          store={selectedStore}
          loadout={viewingInGameLoadout}
          onEdit={setEditingInGameLoadout}
          onShare={setSharedLoadout}
          onClose={handleViewingSheetClose}
        />
      )}
      {showSnapshot && (
        <EditInGameLoadout
          key="snapshot"
          characterId={selectedStore.id}
          onClose={handleSnapshotSheetClose}
        />
      )}
      {editingInGameLoadout && (
        <EditInGameLoadout
          key="editsheet"
          loadout={editingInGameLoadout}
          onClose={handleEditSheetClose}
        />
      )}
    </PageWithMenu>
  );
}

function useAddSeasonHeaders(loadouts: Loadout[], loadoutSort: LoadoutSort) {
  const defs = useD2Definitions()!;
  let loadoutRows: (Loadout | DestinySeasonDefinition)[] = loadouts;
  if (loadoutSort === LoadoutSort.ByEditTime) {
    const seasons = Object.values(defs.Season.getAll())
      .sort((a, b) => b.seasonNumber - a.seasonNumber)
      .filter((s) => s.startDate);

    const grouped = Map.groupBy(loadouts, (loadout) => getLoadoutSeason(loadout, seasons)!);

    loadoutRows = [...grouped.entries()].flatMap(([season, loadouts]) => [season, ...loadouts]);
  }
  return loadoutRows;
}
