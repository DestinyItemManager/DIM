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
import { getCurrentStore, getStore } from 'app/inventory/stores-helpers';
import {
  MakeLoadoutAnalysisAvailable,
  useUpdateLoadoutAnalysisContext,
} from 'app/loadout-analyzer/hooks';
import { editLoadout } from 'app/loadout-drawer/loadout-events';
import { resolveInGameLoadoutIdentifiers } from 'app/loadout-drawer/loadout-type-converters';
import { InGameLoadout, Loadout } from 'app/loadout-drawer/loadout-types';
import { newLoadout, newLoadoutFromEquipped } from 'app/loadout-drawer/loadout-utils';
import { loadoutsForClassTypeSelector } from 'app/loadout-drawer/loadouts-selector';
import { useD2Definitions } from 'app/manifest/selectors';
import { useSetting } from 'app/settings/hooks';
import { AppIcon, addIcon, faCalculator, uploadIcon } from 'app/shell/icons';
import { querySelector, useIsPhonePortrait } from 'app/shell/selectors';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import { usePageTitle } from 'app/utils/hooks';
import { DestinySeasonDefinition } from 'bungie-api-ts/destiny2';
import { useCallback, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link, useLocation } from 'react-router-dom';
import styles from './Loadouts.m.scss';
import LoadoutRow from './LoadoutsRow';
import EditInGameLoadout, { EditInGameLoadoutSaveHandler } from './ingame/EditInGameLoadout';
import { InGameLoadoutDetails } from './ingame/InGameLoadoutDetailsSheet';
import { InGameLoadoutStrip } from './ingame/InGameLoadoutStrip';
import { editInGameLoadout, snapshotInGameLoadout } from './ingame/ingame-loadout-apply';
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
  const defs = useD2Definitions()!;
  const location = useLocation();
  const locationStoreId = (location.state as { storeId: string } | undefined)?.storeId;
  const stores = useSelector(sortedStoresSelector);
  const currentStore = getCurrentStore(stores)!;
  const [selectedStoreId, setSelectedStoreId] = useState(
    locationStoreId && locationStoreId !== 'vault' ? locationStoreId : currentStore.id,
  );
  const [sharedLoadout, setSharedLoadout] = useState<Loadout>();
  const [loadoutImportOpen, setLoadoutImportOpen] = useState<boolean>(false);
  const selectedStore = getStore(stores, selectedStoreId)!;
  const classType = selectedStore.classType;
  const isPhonePortrait = useIsPhonePortrait();
  const query = useSelector(querySelector);
  const [loadoutSort, setLoadoutSort] = useSetting('loadoutSort');
  const language = useSelector(languageSelector);
  const apiPermissionGranted = useSelector(apiPermissionGrantedSelector);
  const dispatch = useThunkDispatch();

  const savedLoadouts = useSelector(loadoutsForClassTypeSelector(classType));
  const savedLoadoutIds = new Set(savedLoadouts.map((l) => l.id));

  const artifactUnlocks = useSelector(artifactUnlocksSelector(selectedStoreId));

  const currentLoadout = useMemo(
    () => newLoadoutFromEquipped(t('Loadouts.FromEquipped'), selectedStore, artifactUnlocks),
    [artifactUnlocks, selectedStore],
  );

  useUpdateLoadoutAnalysisContext(selectedStoreId);

  const [showSnapshot, setShowSnapshot] = useState(false);
  const handleSnapshot = useCallback(() => setShowSnapshot(true), []);
  const handleSnapshotSheetClose = useCallback(() => setShowSnapshot(false), []);

  const [editingInGameLoadout, setEditingInGameLoadout] = useState<InGameLoadout>();
  const handleEditSheetClose = useCallback(() => setEditingInGameLoadout(undefined), []);

  const [savingAsInGameLoadout, setSavingAsInGameLoadout] = useState<Loadout>();

  const [viewingInGameLoadout, setViewingInGameLoadout] = useState<InGameLoadout>();
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

  const loadouts = searchAndSortLoadoutsByQuery(filteredLoadouts, query, language, loadoutSort);
  if (!filteringLoadouts) {
    loadouts.unshift(currentLoadout);
  }

  const handleNewLoadout = () => {
    const loadout = newLoadout('', [], selectedStore.classType);
    editLoadout(loadout, selectedStore.id, { isNew: true });
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
  const handleSaveSnapshot: EditInGameLoadoutSaveHandler = async (
    nameHash,
    colorHash,
    iconHash,
    slot,
  ) => {
    const { name, colorIcon, icon } = resolveInGameLoadoutIdentifiers(defs, {
      nameHash,
      colorHash,
      iconHash,
    });
    return dispatch(
      snapshotInGameLoadout({
        nameHash,
        colorHash,
        iconHash,
        name,
        colorIcon,
        icon,
        index: slot,
        characterId: selectedStoreId,
        items: [],
        id: `ingame-${selectedStoreId}-${slot}`,
      }),
    );
  };

  const handleUpdateInGameLoadout: EditInGameLoadoutSaveHandler = async (
    nameHash,
    colorHash,
    iconHash,
  ) => {
    const { name, colorIcon, icon } = resolveInGameLoadoutIdentifiers(defs, {
      nameHash,
      colorHash,
      iconHash,
    });
    return dispatch(
      editInGameLoadout({
        ...editingInGameLoadout!,
        nameHash,
        name,
        colorHash,
        colorIcon,
        iconHash,
        icon,
      }),
    );
  };

  const handleSaveAsInGameLoadout: EditInGameLoadoutSaveHandler = async (
    nameHash,
    colorHash,
    iconHash,
  ) => {
    // TODO: Actually implement it
    // Choose identifiers
    // Choose slot
    // equip loadout
    // snapshot loadout
    // offer to revert?
    const { name, colorIcon, icon } = resolveInGameLoadoutIdentifiers(defs, {
      nameHash,
      colorHash,
      iconHash,
    });

    dispatch(
      editInGameLoadout({
        ...editingInGameLoadout!,
        nameHash,
        name,
        colorHash,
        colorIcon,
        iconHash,
        icon,
      }),
    );
  };

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
            <PageWithMenu.MenuButton onClick={() => scrollToLoadout(loadout.id)} key={loadout.id}>
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
        {!filteringLoadouts && (
          <InGameLoadoutStrip
            store={selectedStore}
            onEdit={setEditingInGameLoadout}
            onShare={setSharedLoadout}
            onShowDetails={setViewingInGameLoadout}
          />
        )}
        <h2>{t('Loadouts.DimLoadouts')}</h2>
        {filterPills}
        <WindowVirtualList
          ref={virtualListRef}
          numElements={loadoutRows.length}
          itemContainerClassName={styles.loadoutRow}
          estimatedSize={270}
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
                  onSaveAsInGameLoadout={setSavingAsInGameLoadout}
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
          currentStoreId={selectedStoreId}
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
          characterId={selectedStoreId}
          onClose={handleSnapshotSheetClose}
          onSave={handleSaveSnapshot}
        />
      )}
      {editingInGameLoadout && (
        <EditInGameLoadout
          key="editsheet"
          loadout={editingInGameLoadout}
          onClose={handleEditSheetClose}
          onSave={handleUpdateInGameLoadout}
        />
      )}
      {savingAsInGameLoadout && (
        <EditInGameLoadout
          characterId={selectedStoreId}
          onClose={handleEditSheetClose}
          onSave={handleSaveAsInGameLoadout}
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

    const grouped = Map.groupBy(
      loadouts,
      (loadout) =>
        seasons.find(
          (s) => new Date(s.startDate!).getTime() <= (loadout.lastUpdatedAt ?? Date.now()),
        )!,
    );

    loadoutRows = [...grouped.entries()].flatMap(([season, loadouts]) => [season, ...loadouts]);
  }
  return loadoutRows;
}
