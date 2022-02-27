import { settingSelector } from 'app/dim-api/selectors';
import ClassIcon from 'app/dim-ui/ClassIcon';
import { startFarming } from 'app/farming/actions';
import { t } from 'app/i18next-t';
import { InventoryBuckets } from 'app/inventory/inventory-buckets';
import { DimItem } from 'app/inventory/item-types';
import { allItemsSelector, bucketsSelector, hasClassifiedSelector } from 'app/inventory/selectors';
import { editLoadout } from 'app/loadout-drawer/loadout-events';
import MaxlightButton from 'app/loadout-drawer/MaxlightButton';
import { ItemFilter } from 'app/search/filter-types';
import { LoadoutSort } from 'app/settings/initial-settings';
import { RootState, ThunkDispatchProp } from 'app/store/types';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import _ from 'lodash';
import React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { createSelector } from 'reselect';
import { DimStore } from '../inventory/store-types';
import { showNotification } from '../notifications/notifications';
import { filteredItemsSelector, searchFilterSelector } from '../search/search-filter';
import {
  addIcon,
  AppIcon,
  banIcon,
  editIcon,
  engramIcon,
  faExclamationTriangle,
  faList,
  faRandom,
  levellingIcon,
  rightArrowIcon,
  searchIcon,
  sendIcon,
  undoIcon,
} from '../shell/icons';
import { querySelector } from '../shell/selectors';
import { queueAction } from '../utils/action-queue';
import {
  gatherEngramsLoadout,
  itemLevelingLoadout,
  itemMoveLoadout,
  randomLoadout,
} from './auto-loadouts';
import { applyLoadout } from './loadout-apply';
import { Loadout } from './loadout-types';
import { isMissingItems, newLoadout } from './loadout-utils';
import styles from './LoadoutPopup.m.scss';
import { makeRoomForPostmaster, totalPostmasterItems } from './postmaster';
import { loadoutsSelector, previousLoadoutSelector } from './selectors';

interface ProvidedProps {
  dimStore: DimStore;
  onClick?(e: React.MouseEvent): void;
}

interface StoreProps {
  previousLoadout?: Loadout;
  loadouts: Loadout[];
  query: string;
  hasClassified: boolean;
  buckets: InventoryBuckets;
  searchFilter: ItemFilter;
  allItems: DimItem[];
  filteredItems: DimItem[];
}

type Props = ProvidedProps & StoreProps & ThunkDispatchProp;

function mapStateToProps() {
  const loadoutSortSelector = settingSelector('loadoutSort');
  const loadoutsForPlatform = createSelector(
    loadoutsSelector,
    loadoutSortSelector,
    (_state: RootState, { dimStore }: ProvidedProps) => dimStore,
    (loadouts, loadoutSort, dimStore) =>
      _.sortBy(
        loadouts.filter(
          (loadout) =>
            dimStore.classType === DestinyClass.Unknown ||
            loadout.classType === DestinyClass.Unknown ||
            loadout.classType === dimStore.classType
        ),
        loadoutSort === LoadoutSort.ByEditTime ? (l) => -(l.lastUpdatedAt ?? 0) : (l) => l.name
      )
  );

  return (state: RootState, ownProps: ProvidedProps): StoreProps => ({
    previousLoadout: previousLoadoutSelector(state, ownProps.dimStore.id),
    loadouts: loadoutsForPlatform(state, ownProps),
    query: querySelector(state),
    searchFilter: searchFilterSelector(state),
    buckets: bucketsSelector(state)!,
    hasClassified: hasClassifiedSelector(state),
    allItems: allItemsSelector(state),
    filteredItems: filteredItemsSelector(state),
  });
}

function LoadoutPopup({
  dimStore,
  previousLoadout,
  loadouts,
  query,
  onClick,
  hasClassified,
  searchFilter,
  buckets,
  allItems,
  filteredItems,
  dispatch,
}: Props) {
  // For the most part we don't need to memoize this - this menu is destroyed when closed

  const numPostmasterItemsTotal = totalPostmasterItems(dimStore);

  const makeNewLoadout = () =>
    editLoadout(newLoadout('', [], dimStore.classType), dimStore.id, { isNew: true });

  const applySavedLoadout = (loadout: Loadout, { filterToEquipped = false } = {}) => {
    if (filterToEquipped) {
      loadout = filterLoadoutToEquipped(loadout);
    }

    dispatch(applyLoadout(dimStore, loadout, { allowUndo: true, onlyMatchingClass: true }));
  };

  // A D1 dynamic loadout set up to level weapons and armor
  const makeItemLevelingLoadout = () => {
    const loadout = itemLevelingLoadout(allItems, dimStore);
    dispatch(applyLoadout(dimStore, loadout, { allowUndo: true }));
  };

  // A D1 dynamic loadout set up to grab engrams from inventory
  const applyGatherEngramsLoadout = (options: { exotics: boolean } = { exotics: false }) => {
    let loadout;
    try {
      loadout = gatherEngramsLoadout(allItems, options);
    } catch (e) {
      showNotification({ type: 'warning', title: t('Loadouts.GatherEngrams'), body: e.message });
      return;
    }
    dispatch(applyLoadout(dimStore, loadout, { allowUndo: true }));
  };

  const applyRandomLoadout = (e: React.MouseEvent, weaponsOnly = false) => {
    if (
      !window.confirm(
        weaponsOnly
          ? t('Loadouts.RandomizeWeapons')
          : query.length > 0
          ? t('Loadouts.RandomizeSearchPrompt', { query })
          : t('Loadouts.RandomizePrompt')
      )
    ) {
      e.preventDefault();
      return;
    }
    try {
      const loadout = randomLoadout(
        dimStore,
        allItems,
        weaponsOnly ? (i) => i.bucket?.sort === 'Weapons' && searchFilter(i) : searchFilter
      );
      if (loadout) {
        dispatch(applyLoadout(dimStore, loadout, { allowUndo: true }));
      }
    } catch (e) {
      showNotification({ type: 'warning', title: t('Loadouts.Random'), body: e.message });
      return;
    }
  };

  // Move items matching the current search. Max 9 per type.
  const applySearchLoadout = () => {
    const loadout = itemMoveLoadout(filteredItems, dimStore);
    dispatch(applyLoadout(dimStore, loadout, { allowUndo: true }));
  };

  const doMakeRoomForPostmaster = () =>
    queueAction(() => dispatch(makeRoomForPostmaster(dimStore, buckets)));

  const onStartFarming = () => dispatch(startFarming(dimStore.id));

  return (
    <div className={styles.content} onClick={onClick} role="menu">
      <ul className={styles.list}>
        {query.length > 0 && (
          <li className={styles.menuItem}>
            <span onClick={applySearchLoadout}>
              <AppIcon icon={searchIcon} />
              <span>{t('Loadouts.ApplySearch', { query })}</span>
            </span>
          </li>
        )}

        {!dimStore.isVault && (
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

        {dimStore.destinyVersion === 1 && (
          <li className={styles.menuItem}>
            <span onClick={() => applyGatherEngramsLoadout({ exotics: true })}>
              <AppIcon icon={engramIcon} />
              <span>{t('Loadouts.GatherEngrams')}</span>
            </span>
            <span
              className={styles.altButton}
              onClick={() => applyGatherEngramsLoadout({ exotics: false })}
            >
              <AppIcon icon={banIcon} /> <span>{t('Loadouts.GatherEngramsExceptExotics')}</span>
            </span>
          </li>
        )}

        <li className={styles.menuItem}>
          <Link to="../loadouts">
            <AppIcon icon={faList} />
            <span>{t('Loadouts.ManageLoadouts')}</span>
          </Link>
          <AppIcon icon={rightArrowIcon} className={styles.note} />
        </li>

        <li className={styles.menuItem}>
          <span onClick={makeNewLoadout}>
            <AppIcon icon={addIcon} />
            <span>{t('Loadouts.Create')}</span>
          </span>
        </li>

        {previousLoadout && (
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

        {!dimStore.isVault && (
          <>
            <li className={styles.menuItem}>
              <MaxlightButton
                allItems={allItems}
                dimStore={dimStore}
                hasClassified={hasClassified}
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

        {loadouts.map((loadout) => (
          <li key={loadout.id} className={styles.menuItem}>
            <span
              title={loadout.notes ? loadout.notes : loadout.name}
              onClick={() => applySavedLoadout(loadout)}
            >
              {(dimStore.isVault || loadout.classType === DestinyClass.Unknown) && (
                <ClassIcon className={styles.loadoutTypeIcon} classType={loadout.classType} />
              )}
              {isMissingItems(allItems, loadout) && (
                <AppIcon
                  className={styles.warningIcon}
                  icon={faExclamationTriangle}
                  title={t('Loadouts.MissingItemsWarning')}
                />
              )}
              {loadout.name}
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

        {!dimStore.isVault && (
          <li className={styles.menuItem}>
            <span onClick={applyRandomLoadout}>
              <AppIcon icon={faRandom} />
              <span>
                {query.length > 0 ? t('Loadouts.RandomizeSearch') : t('Loadouts.Randomize')}
              </span>
            </span>
            {query.length === 0 && (
              <span className={styles.altButton} onClick={(e) => applyRandomLoadout(e, true)}>
                <span>{t('Loadouts.WeaponsOnly')}</span>
              </span>
            )}
          </li>
        )}
      </ul>
    </div>
  );
}

export default connect<StoreProps, {}, ProvidedProps>(mapStateToProps)(LoadoutPopup);

/**
 * Filter a loadout down to only the equipped items in the loadout.
 */
function filterLoadoutToEquipped(loadout: Loadout) {
  return {
    ...loadout,
    items: loadout.items.filter((i) => i.equipped),
  };
}
