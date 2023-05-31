import { LoadoutSort } from '@destinyitemmanager/dim-api-types';
import { DestinyAccount } from 'app/accounts/destiny-account';
import { apiPermissionGrantedSelector, languageSelector } from 'app/dim-api/selectors';
import { AlertIcon } from 'app/dim-ui/AlertIcon';
import CharacterSelect from 'app/dim-ui/CharacterSelect';
import PageWithMenu from 'app/dim-ui/PageWithMenu';
import ShowPageLoading from 'app/dim-ui/ShowPageLoading';
import ColorDestinySymbols from 'app/dim-ui/destiny-symbols/ColorDestinySymbols';
import useScrollPaginate from 'app/dim-ui/useScrollPaginate';
import { t, tl } from 'app/i18next-t';
import { artifactUnlocksSelector, sortedStoresSelector } from 'app/inventory/selectors';
import { useLoadStores } from 'app/inventory/store/hooks';
import { getCurrentStore, getStore } from 'app/inventory/stores-helpers';
import { editLoadout } from 'app/loadout-drawer/loadout-events';
import { InGameLoadout, Loadout } from 'app/loadout-drawer/loadout-types';
import { newLoadout, newLoadoutFromEquipped } from 'app/loadout-drawer/loadout-utils';
import { useSetting } from 'app/settings/hooks';
import { AppIcon, addIcon, faCalculator, uploadIcon } from 'app/shell/icons';
import { querySelector, useIsPhonePortrait } from 'app/shell/selectors';
import { Portal } from 'app/utils/temp-container';
import _ from 'lodash';
import { useCallback, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link, useLocation } from 'react-router-dom';
import styles from './Loadouts.m.scss';
import LoadoutRow from './LoadoutsRow';
import EditInGameLoadout from './ingame/EditInGameLoadout';
import { InGameLoadoutDetails } from './ingame/InGameLoadoutDetailsSheet';
import { InGameLoadoutStrip } from './ingame/InGameLoadoutStrip';
import LoadoutImportSheet from './loadout-share/LoadoutImportSheet';
import LoadoutShareSheet from './loadout-share/LoadoutShareSheet';
import {
  searchAndSortLoadoutsByQuery,
  useLoadoutFilterPills,
  useSavedLoadoutsForClassType,
} from './loadout-ui/menu-hooks';

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

  if (!storesLoaded) {
    return <ShowPageLoading message={t('Loading.Profile')} />;
  }

  return <Loadouts account={account} />;
}

function Loadouts({ account }: { account: DestinyAccount }) {
  const location = useLocation();
  const locationStoreId = (location.state as { storeId: string } | undefined)?.storeId;
  const stores = useSelector(sortedStoresSelector);
  const currentStore = getCurrentStore(stores)!;
  const [selectedStoreId, setSelectedStoreId] = useState(
    locationStoreId && locationStoreId !== 'vault' ? locationStoreId : currentStore.id
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

  const savedLoadouts = useSavedLoadoutsForClassType(classType);
  const savedLoadoutIds = new Set(savedLoadouts.map((l) => l.id));

  const artifactUnlocks = useSelector(artifactUnlocksSelector(selectedStoreId));

  const currentLoadout = useMemo(
    () => newLoadoutFromEquipped(t('Loadouts.FromEquipped'), selectedStore, artifactUnlocks),
    [artifactUnlocks, selectedStore]
  );

  const [showSnapshot, setShowSnapshot] = useState(false);
  const handleSnapshot = useCallback(() => setShowSnapshot(true), []);
  const handleSnapshotSheetClose = useCallback(() => setShowSnapshot(false), []);

  const [editingInGameLoadout, setEditingInGameLoadout] = useState<InGameLoadout>();
  const handleEditSheetClose = useCallback(() => setEditingInGameLoadout(undefined), []);

  const [viewingInGameLoadout, setViewingInGameLoadout] = useState<InGameLoadout>();
  const handleViewingSheetClose = useCallback(() => setViewingInGameLoadout(undefined), []);

  const [filteredLoadouts, filterPills, hasSelectedFilters] = useLoadoutFilterPills(
    savedLoadouts,
    selectedStoreId,
    {
      includeWarningPills: true,
      extra: <span className={styles.hashtagTip}>{t('Loadouts.HashtagTip')}</span>,
    }
  );

  const loadouts = searchAndSortLoadoutsByQuery(filteredLoadouts, query, language, loadoutSort);
  if (!query && !hasSelectedFilters) {
    loadouts.unshift(currentLoadout);
  }

  const handleNewLoadout = () => {
    const loadout = newLoadout('', [], selectedStore.classType);
    editLoadout(loadout, selectedStore.id, { isNew: true });
  };

  const [numItemsToShow, _resetPage, marker] = useScrollPaginate(2);
  const paginatedLoadouts = isPhonePortrait ? _.take(loadouts, numItemsToShow) : loadouts;

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
          <Link className={styles.menuButton} to={`../optimizer?class=${selectedStore.classType}`}>
            <AppIcon icon={faCalculator} /> {t('LB.LB')}
          </Link>
        </div>
        {!isPhonePortrait &&
          loadouts.map((loadout) => (
            <PageWithMenu.MenuButton anchor={loadout.id} key={loadout.id}>
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
        <h2>{t('Loadouts.InGameLoadouts')}</h2>
        <InGameLoadoutStrip
          store={selectedStore}
          onEdit={setEditingInGameLoadout}
          onShare={setSharedLoadout}
          onShowDetails={setViewingInGameLoadout}
        />
        <h2>{t('Loadouts.DimLoadouts')}</h2>
        {filterPills}
        {paginatedLoadouts.map((loadout) => (
          <LoadoutRow
            key={loadout.id}
            loadout={loadout}
            store={selectedStore}
            saved={savedLoadoutIds.has(loadout.id)}
            equippable={loadout !== currentLoadout}
            onShare={setSharedLoadout}
            onSnapshotInGameLoadout={handleSnapshot}
          />
        ))}
        {loadouts.length === 0 && <p>{t('Loadouts.NoneMatch', { query })}</p>}
        {isPhonePortrait && marker}
      </PageWithMenu.Contents>
      {sharedLoadout && (
        <Portal>
          <LoadoutShareSheet
            account={account}
            loadout={sharedLoadout}
            onClose={() => setSharedLoadout(undefined)}
          />
        </Portal>
      )}
      {loadoutImportOpen && (
        <Portal>
          <LoadoutImportSheet
            currentStoreId={selectedStoreId}
            onClose={() => setLoadoutImportOpen(false)}
          />
        </Portal>
      )}
      {viewingInGameLoadout && (
        <Portal>
          <InGameLoadoutDetails
            store={selectedStore}
            loadout={viewingInGameLoadout}
            onEdit={setEditingInGameLoadout}
            onShare={setSharedLoadout}
            onClose={handleViewingSheetClose}
          />
        </Portal>
      )}
      {showSnapshot && (
        <Portal>
          <EditInGameLoadout characterId={selectedStoreId} onClose={handleSnapshotSheetClose} />
        </Portal>
      )}
      {editingInGameLoadout && (
        <Portal key="editsheet">
          <EditInGameLoadout loadout={editingInGameLoadout} onClose={handleEditSheetClose} />
        </Portal>
      )}
    </PageWithMenu>
  );
}
