import { LoadoutSort } from '@destinyitemmanager/dim-api-types';
import { DestinyAccount } from 'app/accounts/destiny-account';
import { apiPermissionGrantedSelector, languageSelector } from 'app/dim-api/selectors';
import { AlertIcon } from 'app/dim-ui/AlertIcon';
import CharacterSelect from 'app/dim-ui/CharacterSelect';
import PageWithMenu from 'app/dim-ui/PageWithMenu';
import ShowPageLoading from 'app/dim-ui/ShowPageLoading';
import { t, tl } from 'app/i18next-t';
import { sortedStoresSelector } from 'app/inventory/selectors';
import { useLoadStores } from 'app/inventory/store/hooks';
import { getCurrentStore, getStore } from 'app/inventory/stores-helpers';
import { editLoadout } from 'app/loadout-drawer/loadout-events';
import { Loadout } from 'app/loadout-drawer/loadout-types';
import { newLoadout, newLoadoutFromEquipped } from 'app/loadout-drawer/loadout-utils';
import { useSetting } from 'app/settings/hooks';
import { addIcon, AppIcon, faCalculator, uploadIcon } from 'app/shell/icons';
import { querySelector, useIsPhonePortrait } from 'app/shell/selectors';
import { Portal } from 'app/utils/temp-container';
import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import LoadoutImportSheet from './loadout-share/LoadoutImportSheet';
import LoadoutShareSheet from './loadout-share/LoadoutShareSheet';
import {
  searchAndSortLoadoutsByQuery,
  useLoadoutFilterPills,
  useSavedLoadoutsForClassType,
} from './loadout-ui/menu-hooks';
import styles from './Loadouts.m.scss';
import LoadoutRow from './LoadoutsRow';

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
  const stores = useSelector(sortedStoresSelector);
  const currentStore = getCurrentStore(stores)!;
  const [selectedStoreId, setSelectedStoreId] = useState(currentStore.id);
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

  const currentLoadout = useMemo(
    () => newLoadoutFromEquipped(t('Loadouts.FromEquipped'), selectedStore),
    [selectedStore]
  );

  const [filteredLoadouts, filterPills, hasSelectedFilters] = useLoadoutFilterPills(
    savedLoadouts,
    selectedStoreId,
    true
  );

  const loadouts = searchAndSortLoadoutsByQuery(filteredLoadouts, query, language, loadoutSort);
  if (!query && !hasSelectedFilters) {
    loadouts.unshift(currentLoadout);
  }

  const handleNewLoadout = () => {
    const loadout = newLoadout('', [], selectedStore.classType);
    editLoadout(loadout, selectedStore.id, { isNew: true });
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
          <Link className={styles.menuButton} to={`../optimizer?class=${selectedStore.classType}`}>
            <AppIcon icon={faCalculator} /> {t('LB.LB')}
          </Link>
        </div>
        {!isPhonePortrait &&
          loadouts.map((loadout) => (
            <PageWithMenu.MenuButton anchor={loadout.id} key={loadout.id}>
              <span>{loadout.name}</span>
            </PageWithMenu.MenuButton>
          ))}
      </PageWithMenu.Menu>

      <PageWithMenu.Contents className={styles.page}>
        {$featureFlags.warnNoSync && !apiPermissionGranted && (
          <p>
            <AlertIcon /> {t('Storage.DimSyncNotEnabled')}
          </p>
        )}
        {filterPills}
        {loadouts.map((loadout) => (
          <LoadoutRow
            key={loadout.id}
            loadout={loadout}
            store={selectedStore}
            saved={savedLoadoutIds.has(loadout.id)}
            equippable={loadout !== currentLoadout}
            onShare={setSharedLoadout}
          />
        ))}
        {loadouts.length === 0 && <p>{t('Loadouts.NoneMatch', { query })}</p>}
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
            currentStoreId={currentStore.id}
            onClose={() => setLoadoutImportOpen(false)}
          />
        </Portal>
      )}
    </PageWithMenu>
  );
}
