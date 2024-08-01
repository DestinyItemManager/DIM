import { SearchType } from '@destinyitemmanager/dim-api-types';
import { languageSelector, settingSelector } from 'app/dim-api/selectors';
import { AlertIcon } from 'app/dim-ui/AlertIcon';
import ClassIcon from 'app/dim-ui/ClassIcon';
import ColorDestinySymbols from 'app/dim-ui/destiny-symbols/ColorDestinySymbols';
import { startFarming } from 'app/farming/actions';
import { t } from 'app/i18next-t';
import {
  allItemsSelector,
  bucketsSelector,
  unlockedPlugSetItemsSelector,
} from 'app/inventory/selectors';
import { DimStore } from 'app/inventory/store-types';
import { powerLevelSelector } from 'app/inventory/store/selectors';
import { itemLevelingLoadout, itemMoveLoadout } from 'app/loadout-drawer/auto-loadouts';
import { applyLoadout } from 'app/loadout-drawer/loadout-apply';
import {
  randomizeFullLoadout,
  randomizeLoadoutItems,
  randomizeLoadoutMods,
  randomizeLoadoutSubclass,
} from 'app/loadout-drawer/loadout-drawer-reducer';
import { editLoadout } from 'app/loadout-drawer/loadout-events';
import {
  isArmorModsOnly,
  isFashionOnly,
  isMissingItems,
  newLoadout,
} from 'app/loadout-drawer/loadout-utils';
import { makeRoomForPostmaster, totalPostmasterItems } from 'app/loadout-drawer/postmaster';
import { updateLoadoutStore } from 'app/loadout/actions';
import { InGameLoadout, Loadout } from 'app/loadout/loadout-types';
import { loadoutsForClassTypeSelector } from 'app/loadout/loadouts-selector';
import { previousLoadoutSelector } from 'app/loadout/selectors';
import { manifestSelector, useDefinitions } from 'app/manifest/selectors';
import { showMaterialCount } from 'app/material-counts/MaterialCountsWrappers';
import { showNotification } from 'app/notifications/notifications';
import SearchBar from 'app/search/SearchBar';
import { filteredItemsSelector, searchFilterSelector } from 'app/search/items/item-search-filter';
import { loadoutFilterFactorySelector } from 'app/search/loadouts/loadout-search-filter';
import {
  AppIcon,
  addIcon,
  editIcon,
  engramIcon,
  faList,
  faRandom,
  levellingIcon,
  rightArrowIcon,
  searchIcon,
  sendIcon,
  undoIcon,
} from 'app/shell/icons';
import { querySelector, useIsPhonePortrait } from 'app/shell/selectors';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import { RootState, ThunkResult } from 'app/store/types';
import { queueAction } from 'app/utils/action-queue';
import { emptyArray } from 'app/utils/empty';
import { errorMessage } from 'app/utils/errors';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import consumablesIcon from 'destiny-icons/general/consumables.svg';
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { InGameLoadoutIconWithIndex } from '../ingame/InGameLoadoutIcon';
import { applyInGameLoadout } from '../ingame/ingame-loadout-apply';
import { inGameLoadoutsForCharacterSelector } from '../ingame/selectors';
import {
  FashionIcon,
  ModificationsIcon,
  searchAndSortLoadoutsByQuery,
  useLoadoutFilterPills,
} from '../loadout-ui/menu-hooks';
import styles from './LoadoutPopup.m.scss';
import { RandomLoadoutOptions, useRandomizeLoadout } from './LoadoutPopupRandomize';
import MaxlightButton from './MaxlightButton';

export default function LoadoutPopup({
  dimStore,
  onClick,
}: {
  dimStore: DimStore;
  onClick?: () => void;
}) {
  // For the most part we don't need to memoize this - this menu is destroyed when closed
  const defs = useDefinitions()!;
  const isPhonePortrait = useIsPhonePortrait();
  const numPostmasterItemsTotal = totalPostmasterItems(dimStore);
  const language = useSelector(languageSelector);
  const previousLoadout = useSelector(previousLoadoutSelector(dimStore.id));
  const query = useSelector(querySelector);
  const buckets = useSelector(bucketsSelector)!;
  const allItems = useSelector(allItemsSelector);
  const filteredItems = useSelector(filteredItemsSelector);
  const loadoutSort = useSelector(settingSelector('loadoutSort'));
  const dispatch = useThunkDispatch();
  const hasClassifiedAffectingMaxPower = useSelector(
    (state: RootState) => powerLevelSelector(state, dimStore.id)?.problems.hasClassified,
  );

  const loadouts = useSelector(loadoutsForClassTypeSelector(dimStore.classType));
  const inGameLoadouts = useSelector((state: RootState) =>
    dimStore.isVault
      ? emptyArray<InGameLoadout>()
      : inGameLoadoutsForCharacterSelector(state, dimStore.id),
  );

  const [loadoutQuery, setLoadoutQuery] = useState('');

  // This sets the store id for loadouts page, so that when navigating to it the correct
  // character will be set.
  const setLoadoutPageStore = () => {
    if (!dimStore.isVault) {
      dispatch(updateLoadoutStore({ storeId: dimStore.id }));
    }
  };

  const makeNewLoadout = () =>
    editLoadout(newLoadout('', [], dimStore.classType), dimStore.id, { isNew: true });

  const applySavedLoadout = (loadout: Loadout, { filterToEquipped = false } = {}) => {
    if (filterToEquipped) {
      loadout = filterLoadoutToEquipped(loadout);
    }

    dispatch(applyLoadout(dimStore, loadout, { allowUndo: true, onlyMatchingClass: true }));
  };

  const handleApplyInGameLoadout = (loadout: InGameLoadout) =>
    dispatch(applyInGameLoadout(loadout));

  // A D1 dynamic loadout set up to level weapons and armor
  const makeItemLevelingLoadout = () => {
    const loadout = itemLevelingLoadout(allItems, dimStore);
    dispatch(applyLoadout(dimStore, loadout, { allowUndo: true }));
  };

  // Move items matching the current search. Max 9 per type.
  const applySearchLoadout = () => {
    const loadout = itemMoveLoadout(filteredItems, dimStore);
    dispatch(applyLoadout(dimStore, loadout, { allowUndo: true }));
  };

  const doMakeRoomForPostmaster = () =>
    queueAction(() => dispatch(makeRoomForPostmaster(dimStore, buckets)));

  const onStartFarming = () => dispatch(startFarming(dimStore.id));

  const totalLoadouts = loadouts.length;

  const [pillFilteredLoadouts, filterPills, hasSelectedFilters] = useLoadoutFilterPills(
    loadouts,
    dimStore,
    { className: styles.filterPills, darkBackground: true },
  );

  const loadoutFilterFactory = useSelector(loadoutFilterFactorySelector);
  const filteredLoadouts = searchAndSortLoadoutsByQuery(
    pillFilteredLoadouts,
    loadoutFilterFactory,
    loadoutQuery,
    language,
    loadoutSort,
  );

  const blockPropagation = (e: React.MouseEvent) => e.stopPropagation();

  const filteringLoadouts = loadoutQuery.length > 0 || hasSelectedFilters;

  return (
    <div className={styles.content} onClick={onClick} role="menu">
      {totalLoadouts >= 10 && (
        <div onClick={blockPropagation}>
          <SearchBar
            className={styles.filterInput}
            placeholder={t('Header.FilterHelpLoadouts')}
            onQueryChanged={setLoadoutQuery}
            searchType={SearchType.Loadout}
            instant
          />
        </div>
      )}

      {filterPills}

      <ul className={styles.list}>
        {!filteringLoadouts && dimStore.isVault && isPhonePortrait && (
          <li className={styles.menuItem}>
            <span onClick={showMaterialCount}>
              <img src={consumablesIcon} />
              <span>{t('Header.MaterialCounts')}</span>
            </span>
          </li>
        )}

        {!filteringLoadouts && query.length > 0 && (
          <li className={styles.menuItem}>
            <span onClick={applySearchLoadout}>
              <AppIcon icon={searchIcon} />
              <span>{t('Loadouts.ApplySearch', { query })}</span>
            </span>
          </li>
        )}

        {!filteringLoadouts && !dimStore.isVault && (
          <li className={styles.menuItem}>
            <span onClick={onStartFarming}>
              <AppIcon icon={engramIcon} />
              <span>
                {t('FarmingMode.FarmingMode')}{' '}
                <span className={styles.note}>{t('FarmingMode.FarmingModeNote')}</span>
              </span>
            </span>
          </li>
        )}

        {!filteringLoadouts && dimStore.destinyVersion === 2 && (
          <li className={styles.menuItem}>
            <Link to="../loadouts" onClick={setLoadoutPageStore}>
              <AppIcon icon={faList} />
              <span>{t('Loadouts.ManageLoadouts')}</span>
            </Link>
            <AppIcon icon={rightArrowIcon} className={styles.note} />
          </li>
        )}

        {!filteringLoadouts && (
          <li className={styles.menuItem}>
            <span onClick={makeNewLoadout}>
              <AppIcon icon={addIcon} />
              <span>{t('Loadouts.Create')}</span>
            </span>
          </li>
        )}

        {!filteringLoadouts && (
          <li>
            <ul
              className={clsx(styles.inGameLoadouts, {
                [styles.moreLoadouts]: inGameLoadouts.length > 6,
              })}
            >
              {inGameLoadouts.map((loadout) => (
                <li key={loadout.id}>
                  <button
                    type="button"
                    className={styles.inGameLoadoutButton}
                    title={loadout.name}
                    onClick={() => handleApplyInGameLoadout(loadout)}
                  >
                    <InGameLoadoutIconWithIndex loadout={loadout} />
                  </button>
                </li>
              ))}
            </ul>
          </li>
        )}

        {!filteringLoadouts && previousLoadout && (
          <li className={styles.menuItem}>
            <span
              title={previousLoadout.name}
              onClick={() => applySavedLoadout(previousLoadout, { filterToEquipped: true })}
            >
              <AppIcon icon={undoIcon} />
              {previousLoadout.name}
            </span>
            <span className={styles.altButton} onClick={() => applySavedLoadout(previousLoadout)}>
              <span>{t('Loadouts.RestoreAllItems')}</span>
            </span>
          </li>
        )}

        {!filteringLoadouts && !dimStore.isVault && (
          <>
            <li className={styles.menuItem}>
              <MaxlightButton
                allItems={allItems}
                dimStore={dimStore}
                hasClassified={Boolean(hasClassifiedAffectingMaxPower)}
              />
            </li>

            {dimStore.destinyVersion === 1 && (
              <>
                <li className={styles.menuItem}>
                  <span onClick={makeItemLevelingLoadout}>
                    <AppIcon icon={levellingIcon} />
                    <span>{t('Loadouts.ItemLeveling')}</span>
                  </span>
                </li>

                {numPostmasterItemsTotal > 0 && (
                  <li className={styles.menuItem}>
                    <span onClick={doMakeRoomForPostmaster}>
                      <AppIcon icon={sendIcon} />
                      <span>{t('Loadouts.MakeRoom')}</span>
                    </span>
                  </li>
                )}
              </>
            )}
          </>
        )}

        {filteredLoadouts.map((loadout) => (
          <li key={loadout.id} className={styles.menuItem}>
            <span
              title={loadout.notes ? loadout.notes : loadout.name}
              onClick={() => applySavedLoadout(loadout)}
            >
              {defs.isDestiny2 && isFashionOnly(defs, loadout) && (
                <FashionIcon className={styles.fashionIcon} />
              )}
              {defs.isDestiny2 && isArmorModsOnly(defs, loadout) && (
                <ModificationsIcon className={styles.modificationIcon} />
              )}
              {(dimStore.isVault || loadout.classType === DestinyClass.Unknown) && (
                <ClassIcon className={styles.loadoutTypeIcon} classType={loadout.classType} />
              )}
              {isMissingItems(defs, allItems, dimStore.id, loadout) && (
                <AlertIcon
                  className={styles.warningIcon}
                  title={t('Loadouts.MissingItemsWarning')}
                />
              )}
              <ColorDestinySymbols text={loadout.name} />
            </span>
            <span
              className={styles.altButton}
              title={t('Loadouts.Edit')}
              onClick={() => editLoadout(loadout, dimStore.id, { isNew: false })}
            >
              <AppIcon icon={editIcon} />
            </span>
          </li>
        ))}

        {!dimStore.isVault && !loadoutQuery && (
          <RandomLoadoutButton
            store={dimStore}
            query={query}
            isD2={defs.isDestiny2}
            onClick={onClick}
          />
        )}
      </ul>
    </div>
  );
}

/**
 * Filter a loadout down to only the equipped items in the loadout.
 */
function filterLoadoutToEquipped(loadout: Loadout) {
  return {
    ...loadout,
    items: loadout.items.filter((i) => i.equip),
  };
}

function RandomLoadoutButton({
  store,
  isD2,
  query,
  onClick,
}: {
  store: DimStore;
  isD2: boolean;
  query: string;
  onClick?: (e: React.MouseEvent) => void;
}) {
  const dispatch = useThunkDispatch();

  const [dialog, getRandomizeOptions] = useRandomizeLoadout();

  const applyRandomLoadout = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const options = await getRandomizeOptions({
      d2: isD2,
      query,
    });
    if (!options) {
      e.preventDefault();
      onClick?.(e);
      return;
    }
    dispatch(doApplyRandomLoadout(store, options));
    onClick?.(e);
  };

  return (
    <li className={styles.menuItem}>
      {dialog}
      <span onClick={applyRandomLoadout}>
        <AppIcon icon={faRandom} />
        <span>{query.length > 0 ? t('Loadouts.RandomizeSearch') : t('Loadouts.Randomize')}</span>
      </span>
      <span className={styles.altButton} onClick={() => dispatch(createRandomLoadout(store))}>
        <span>{t('Loadouts.RandomizeNew')}</span>
      </span>
    </li>
  );
}

function createRandomLoadout(store: DimStore): ThunkResult {
  return async (_dispatch, getState) => {
    const defs = manifestSelector(getState())!;
    const allItems = allItemsSelector(getState());
    const searchFilter = searchFilterSelector(getState());
    const unlockedPlugs = unlockedPlugSetItemsSelector(store.id)(getState());
    let loadout = newLoadout(t('Loadouts.Random'), [], store.classType);
    loadout = randomizeFullLoadout(defs, store, allItems, searchFilter, unlockedPlugs)(loadout);
    editLoadout(loadout, store.id, { isNew: true });
  };
}

function doApplyRandomLoadout(store: DimStore, options: RandomLoadoutOptions): ThunkResult {
  return async (dispatch, getState) => {
    const defs = manifestSelector(getState())!;
    const allItems = allItemsSelector(getState());
    const searchFilter = searchFilterSelector(getState());
    const unlockedPlugs = unlockedPlugSetItemsSelector(store.id)(getState());

    let loadout = newLoadout(t('Loadouts.Random'), [], store.classType);
    if (options.subclass) {
      loadout = randomizeLoadoutSubclass(defs, store)(loadout);
    }
    if (options.armor) {
      loadout = randomizeLoadoutItems(defs, store, allItems, 'Armor', searchFilter)(loadout);
    }
    if (options.weapons) {
      loadout = randomizeLoadoutItems(defs, store, allItems, 'Weapons', searchFilter)(loadout);
    }
    if (options.general) {
      loadout = randomizeLoadoutItems(defs, store, allItems, 'General', searchFilter)(loadout);
    }
    if (options.mods) {
      loadout = randomizeLoadoutMods(defs, store, allItems, unlockedPlugs)(loadout);
    }

    try {
      if (loadout) {
        await dispatch(applyLoadout(store, loadout, { allowUndo: true }));
      }
    } catch (e) {
      showNotification({ type: 'warning', title: t('Loadouts.Random'), body: errorMessage(e) });
    }
  };
}
