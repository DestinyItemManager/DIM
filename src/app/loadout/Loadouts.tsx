import { LoadoutSort } from '@destinyitemmanager/dim-api-types';
import { DestinyAccount } from 'app/accounts/destiny-account';
import { languageSelector } from 'app/dim-api/selectors';
import CharacterSelect from 'app/dim-ui/CharacterSelect';
import { ConfirmButton } from 'app/dim-ui/ConfirmButton';
import PageWithMenu from 'app/dim-ui/PageWithMenu';
import ShowPageLoading from 'app/dim-ui/ShowPageLoading';
import { t } from 'app/i18next-t';
import { sortedStoresSelector } from 'app/inventory/selectors';
import { DimStore } from 'app/inventory/store-types';
import { useLoadStores } from 'app/inventory/store/hooks';
import { getCurrentStore, getStore } from 'app/inventory/stores-helpers';
import { deleteLoadout } from 'app/loadout-drawer/actions';
import { applyLoadout } from 'app/loadout-drawer/loadout-apply';
import { editLoadout } from 'app/loadout-drawer/loadout-events';
import { Loadout } from 'app/loadout-drawer/loadout-types';
import { newLoadout, newLoadoutFromEquipped } from 'app/loadout-drawer/loadout-utils';
import { loadoutsSelector } from 'app/loadout-drawer/selectors';
import { plainString } from 'app/search/search-filters/freeform';
import { useSetting } from 'app/settings/hooks';
import { addIcon, AppIcon, deleteIcon, faCalculator } from 'app/shell/icons';
import { querySelector, useIsPhonePortrait } from 'app/shell/selectors';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import { Portal } from 'app/utils/temp-container';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import _ from 'lodash';
import React, { ReactNode, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import LoadoutShareSheet from './loadout-share/LoadoutShareSheet';
import styles from './Loadouts.m.scss';
import LoadoutView from './LoadoutView';

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
  const selectedStore = getStore(stores, selectedStoreId)!;
  const classType = selectedStore.classType;
  const allLoadouts = useSelector(loadoutsSelector);
  const [loadoutSort, setLoadoutSort] = useSetting('loadoutSort');
  const isPhonePortrait = useIsPhonePortrait();
  const query = useSelector(querySelector);
  const language = useSelector(languageSelector);

  const savedLoadouts = useMemo(
    () =>
      _.sortBy(
        allLoadouts.filter(
          (loadout) =>
            classType === DestinyClass.Unknown ||
            loadout.classType === DestinyClass.Unknown ||
            loadout.classType === classType
        ),
        loadoutSort === LoadoutSort.ByEditTime ? (l) => -(l.lastUpdatedAt ?? 0) : (l) => l.name
      ),
    [allLoadouts, classType, loadoutSort]
  );

  const currentLoadout = useMemo(
    () => newLoadoutFromEquipped(t('Loadouts.FromEquipped'), selectedStore),
    [selectedStore]
  );

  const loadoutQueryPlain = plainString(query, language);
  const loadouts = [currentLoadout, ...savedLoadouts].filter(
    (loadout) =>
      !query ||
      plainString(loadout.name, language).includes(loadoutQueryPlain) ||
      (loadout.notes && plainString(loadout.notes, language).includes(loadoutQueryPlain))
  );

  const savedLoadoutIds = new Set(savedLoadouts.map((l) => l.id));

  const handleNewLoadout = () => {
    const loadout = newLoadout('', [], selectedStore.classType);
    editLoadout(loadout, selectedStore.id, { isNew: true });
  };

  const sortOptions = [
    {
      key: 'time',
      content: t('Loadouts.SortByEditTime'),
      value: LoadoutSort.ByEditTime,
    },
    {
      key: 'name',
      content: t('Loadouts.SortByName'),
      value: LoadoutSort.ByName,
    },
  ];

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
                {option.content}
              </option>
            ))}
          </select>
          <button type="button" className={styles.menuButton} onClick={handleNewLoadout}>
            <AppIcon icon={addIcon} /> <span>{t('Loadouts.Create')}</span>
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
    </PageWithMenu>
  );
}

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

  const actionButtons = useMemo(() => {
    const handleDeleteClick = (loadout: Loadout) => dispatch(deleteLoadout(loadout.id));

    const handleApply = () =>
      dispatch(applyLoadout(store, loadout, { allowUndo: true, onlyMatchingClass: true }));

    const handleEdit = () => editLoadout(loadout, store.id, { isNew: !saved });
    const actionButtons: ReactNode[] = [];

    if (equippable) {
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
  }, [dispatch, equippable, loadout, onShare, saved, store]);

  return (
    <LoadoutView
      loadout={loadout}
      store={store}
      actionButtons={actionButtons}
      hideShowModPlacements={!equippable}
    />
  );
}
