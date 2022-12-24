import { LoadoutSort } from '@destinyitemmanager/dim-api-types';
import { DestinyAccount } from 'app/accounts/destiny-account';
import { apiPermissionGrantedSelector, languageSelector } from 'app/dim-api/selectors';
import { AlertIcon } from 'app/dim-ui/AlertIcon';
import CharacterSelect from 'app/dim-ui/CharacterSelect';
import { ConfirmButton } from 'app/dim-ui/ConfirmButton';
import FilterPills, { Option } from 'app/dim-ui/FilterPills';
import PageWithMenu from 'app/dim-ui/PageWithMenu';
import ShowPageLoading from 'app/dim-ui/ShowPageLoading';
import { t, tl } from 'app/i18next-t';
import { getHashtagsFromNote } from 'app/inventory/note-hashtags';
import { sortedStoresSelector } from 'app/inventory/selectors';
import { DimStore } from 'app/inventory/store-types';
import { useLoadStores } from 'app/inventory/store/hooks';
import { getCurrentStore, getStore } from 'app/inventory/stores-helpers';
import { deleteLoadout } from 'app/loadout-drawer/actions';
import { applyLoadout } from 'app/loadout-drawer/loadout-apply';
import { editLoadout } from 'app/loadout-drawer/loadout-events';
import { Loadout } from 'app/loadout-drawer/loadout-types';
import {
  isMissingItemsSelector,
  newLoadout,
  newLoadoutFromEquipped,
} from 'app/loadout-drawer/loadout-utils';
import { loadoutsSelector } from 'app/loadout-drawer/selectors';
import { plainString } from 'app/search/search-filters/freeform';
import { useSetting } from 'app/settings/hooks';
import {
  addIcon,
  AppIcon,
  deleteIcon,
  faCalculator,
  faCheckCircle,
  uploadIcon,
} from 'app/shell/icons';
import { querySelector, useIsPhonePortrait } from 'app/shell/selectors';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import { streamDeckSelectionSelector } from 'app/stream-deck/selectors';
import { streamDeckSelectLoadout } from 'app/stream-deck/stream-deck';
import { Portal } from 'app/utils/temp-container';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import deprecatedMods from 'data/d2/deprecated-mods.json';
import _ from 'lodash';
import { ReactNode, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import LoadoutImportSheet from './loadout-share/LoadoutImportSheet';
import LoadoutShareSheet from './loadout-share/LoadoutShareSheet';
import styles from './Loadouts.m.scss';
import LoadoutView from './LoadoutView';

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
  const allSavedLoadouts = useSelector(loadoutsSelector);
  const [loadoutSort, setLoadoutSort] = useSetting('loadoutSort');
  const isPhonePortrait = useIsPhonePortrait();
  const query = useSelector(querySelector);
  const language = useSelector(languageSelector);
  const apiPermissionGranted = useSelector(apiPermissionGrantedSelector);
  const isMissingItems = useSelector(isMissingItemsSelector);
  const [selectedFilters, setSelectedFilters] = useState<Option<string>[]>([]);

  const savedLoadouts = useMemo(
    () =>
      allSavedLoadouts.filter(
        (loadout) =>
          classType === DestinyClass.Unknown ||
          loadout.classType === DestinyClass.Unknown ||
          loadout.classType === classType
      ),
    [allSavedLoadouts, classType]
  );
  const savedLoadoutIds = new Set(savedLoadouts.map((l) => l.id));

  const currentLoadout = useMemo(
    () => newLoadoutFromEquipped(t('Loadouts.FromEquipped'), selectedStore),
    [selectedStore]
  );

  const loadoutsByHashtag: { [hashtag: string]: Loadout[] } = {};
  for (const loadout of savedLoadouts) {
    const hashtags = [...getHashtagsFromNote(loadout.name), ...getHashtagsFromNote(loadout.notes)];
    for (const hashtag of hashtags) {
      (loadoutsByHashtag[hashtag] ??= []).push(loadout);
    }
  }

  const filterOptions = Object.keys(loadoutsByHashtag).map(
    (hashtag): Option<string> => ({
      key: hashtag,
      content: hashtag,
      data: hashtag,
    })
  );

  const loadoutsWithMissingItems = savedLoadouts.filter((loadout) =>
    isMissingItems(selectedStoreId, loadout)
  );

  if (loadoutsWithMissingItems.length) {
    filterOptions.push({
      key: 'missingitems',
      content: (
        <>
          <AlertIcon /> {t('Loadouts.MissingItems')}
        </>
      ),
      data: 'missingitems',
    });
  }

  const loadoutsWithDeprecatedMods = savedLoadouts.filter((loadout) =>
    loadout.parameters?.mods?.some((modHash) => deprecatedMods.includes(modHash))
  );
  if (loadoutsWithDeprecatedMods.length) {
    filterOptions.push({
      key: 'deprecated',
      content: (
        <>
          <AlertIcon /> {t('Loadouts.DeprecatedMods')}
        </>
      ),
      data: 'deprecated',
    });
  }

  function getLoadoutsForSelectedFilters() {
    return _.intersection(
      ...selectedFilters.map((f) => {
        switch (f.data) {
          case 'deprecated':
            return loadoutsWithDeprecatedMods;
          case 'missingitems':
            return loadoutsWithMissingItems;
          default:
            return loadoutsByHashtag[f.data] ?? [];
        }
      })
    );
  }

  const loadoutQueryPlain = plainString(query, language);
  const loadouts = _.sortBy(
    (selectedFilters.length ? getLoadoutsForSelectedFilters() : savedLoadouts).filter(
      (loadout) =>
        !query ||
        plainString(loadout.name, language).includes(loadoutQueryPlain) ||
        (loadout.notes && plainString(loadout.notes, language).includes(loadoutQueryPlain))
    ),
    loadoutSort === LoadoutSort.ByEditTime
      ? (l) => -(l.lastUpdatedAt ?? 0)
      : (l) => l.name.toLowerCase()
  );
  if (!query && !selectedFilters.length) {
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
        {filterOptions.length > 0 && (
          <FilterPills
            options={filterOptions}
            selectedOptions={selectedFilters}
            onOptionsSelected={setSelectedFilters}
          />
        )}
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

// TODO: memoize?
function LoadoutRow({
  loadout,
  store,
  saved,
  equippable,
  onShare,
}: {
  loadout: Loadout;
  store: DimStore;
  saved: boolean;
  equippable: boolean;
  onShare: (loadout: Loadout) => void;
}) {
  const dispatch = useThunkDispatch();

  const streamDeckSelection = $featureFlags.elgatoStreamDeck
    ? // eslint-disable-next-line
      useSelector(streamDeckSelectionSelector)
    : null;

  const actionButtons = useMemo(() => {
    const handleDeleteClick = (loadout: Loadout) => dispatch(deleteLoadout(loadout.id));

    const handleApply = () =>
      dispatch(applyLoadout(store, loadout, { allowUndo: true, onlyMatchingClass: true }));

    const handleEdit = () => editLoadout(loadout, store.id, { isNew: !saved });
    const actionButtons: ReactNode[] = [];

    if (equippable) {
      if (streamDeckSelection === 'loadout') {
        const handleSelection = () => dispatch(streamDeckSelectLoadout(loadout, store));
        return [
          <button
            key="select-for-stream-deck"
            type="button"
            className="dim-button"
            onClick={handleSelection}
          >
            <span className={styles.iconLabel}>{t('StreamDeck.SelectLoadout')}</span>
            <AppIcon icon={faCheckCircle} title={t('StreamDeck.SelectLoadout')} />
          </button>,
        ];
      }

      actionButtons.push(
        <button key="apply" type="button" className="dim-button" onClick={handleApply}>
          {t('Loadouts.Apply')}
        </button>
      );
    }

    actionButtons.push(
      <button key="edit" type="button" className="dim-button" onClick={handleEdit}>
        {saved ? t('Loadouts.EditBrief') : t('Loadouts.SaveLoadout')}
      </button>
    );

    if (loadout.parameters && !_.isEmpty(loadout.parameters)) {
      actionButtons.push(
        <button key="share" type="button" className="dim-button" onClick={() => onShare(loadout)}>
          {t('Loadouts.ShareLoadout')}
        </button>
      );
    }

    if (saved) {
      actionButtons.push(
        <ConfirmButton key="delete" danger onClick={() => handleDeleteClick(loadout)}>
          <AppIcon icon={deleteIcon} title={t('Loadouts.Delete')} />
        </ConfirmButton>
      );
    }

    return actionButtons;
  }, [dispatch, equippable, loadout, onShare, saved, store, streamDeckSelection]);

  return (
    <LoadoutView
      loadout={loadout}
      store={store}
      actionButtons={actionButtons}
      hideShowModPlacements={!equippable}
    />
  );
}
