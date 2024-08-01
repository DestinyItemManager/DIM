import { InfuseDirection } from '@destinyitemmanager/dim-api-types';
import { gaPageView } from 'app/google';
import { t } from 'app/i18next-t';
import { applyLoadout } from 'app/loadout-drawer/loadout-apply';
import { LoadoutItem } from 'app/loadout/loadout-types';
import SearchBar from 'app/search/SearchBar';
import { filterFactorySelector } from 'app/search/items/item-search-filter';
import { useSetting } from 'app/settings/hooks';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import { DimThunkDispatch } from 'app/store/types';
import { useEventBusListener } from 'app/utils/hooks';
import { isD1Item } from 'app/utils/item-utils';
import clsx from 'clsx';
import { useCallback, useDeferredValue, useEffect, useReducer } from 'react';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router';
import Sheet from '../dim-ui/Sheet';
import ConnectedInventoryItem from '../inventory/ConnectedInventoryItem';
import { DimItem } from '../inventory/item-types';
import { allItemsSelector, currentStoreSelector, getTagSelector } from '../inventory/selectors';
import { DimStore } from '../inventory/store-types';
import { convertToLoadoutItem, newLoadout } from '../loadout-drawer/loadout-utils';
import { showNotification } from '../notifications/notifications';
import { AppIcon, faArrowCircleDown, faEquals, faRandom, helpIcon, plusIcon } from '../shell/icons';
import { chainComparator, compareBy, reverseComparator } from '../utils/comparators';
import styles from './InfusionFinder.m.scss';
import { showInfuse$ } from './infuse';

const itemComparator = chainComparator(
  reverseComparator(compareBy((item: DimItem) => item.power)),
  compareBy((item: DimItem) =>
    isD1Item(item) && item.talentGrid
      ? (item.talentGrid.totalXP / item.talentGrid.totalXPRequired) * 0.5
      : 0,
  ),
);

interface State {
  direction: InfuseDirection;
  /** The item we're focused on */
  query?: DimItem;
  /** The item that will be consumed by infusion */
  source?: DimItem;
  /** The item that will have its power increased by infusion */
  target?: DimItem;
  /** Search filter string */
  filter: string;
}

type Action =
  /** Reset the tool (for when the sheet is closed) */
  | { type: 'reset' }
  /** Set up the tool with a new focus item */
  | { type: 'init'; item: DimItem; hasInfusables: boolean; hasFuel: boolean }
  /** Swap infusion direction */
  | { type: 'swapDirection' }
  /** Select one of the items in the list */
  | { type: 'selectItem'; item: DimItem }
  | { type: 'setFilter'; filter: string };

/**
 * All state for this component is managed through this reducer and the Actions above.
 */
function stateReducer(state: State, action: Action): State {
  switch (action.type) {
    case 'reset':
      return {
        ...state,
        query: undefined,
        source: undefined,
        target: undefined,
        filter: '',
      };
    case 'init': {
      const direction =
        state.direction === InfuseDirection.INFUSE
          ? action.hasInfusables
            ? InfuseDirection.INFUSE
            : InfuseDirection.FUEL
          : action.hasFuel
            ? InfuseDirection.FUEL
            : InfuseDirection.INFUSE;

      return {
        ...state,
        direction,
        query: action.item,
        target: direction === InfuseDirection.INFUSE ? action.item : undefined,
        source: direction === InfuseDirection.INFUSE ? undefined : action.item,
      };
    }
    case 'swapDirection': {
      const direction =
        state.direction === InfuseDirection.INFUSE ? InfuseDirection.FUEL : InfuseDirection.INFUSE;
      return {
        ...state,
        direction,
        target: direction === InfuseDirection.INFUSE ? state.query : undefined,
        source: direction === InfuseDirection.FUEL ? state.query : undefined,
      };
    }
    case 'selectItem': {
      if (state.direction === InfuseDirection.INFUSE) {
        return {
          ...state,
          target: state.query,
          source: action.item,
        };
      } else {
        return {
          ...state,
          target: action.item,
          source: state.query,
        };
      }
    }
    case 'setFilter': {
      return {
        ...state,
        filter: action.filter,
      };
    }
  }
}

export default function InfusionFinder() {
  const dispatch = useThunkDispatch();
  const allItems = useSelector(allItemsSelector);
  const currentStore = useSelector(currentStoreSelector);
  const getTag = useSelector(getTagSelector);
  const filters = useSelector(filterFactorySelector);
  const [lastInfusionDirection, setLastInfusionDirection] = useSetting('infusionDirection');

  const [{ direction, query, source, target, filter: liveFilter }, stateDispatch] = useReducer(
    stateReducer,
    {
      direction: lastInfusionDirection,
      filter: '',
    },
  );
  const filter = useDeferredValue(liveFilter);

  const reset = () => stateDispatch({ type: 'reset' });
  const selectItem = (item: DimItem) => stateDispatch({ type: 'selectItem', item });
  const onQueryChanged = (filter: string) => stateDispatch({ type: 'setFilter', filter });
  const switchDirection = () => stateDispatch({ type: 'swapDirection' });
  const show = query !== undefined;

  const destinyVersion = currentStore?.destinyVersion;

  useEffect(() => {
    if (show && destinyVersion) {
      gaPageView(`/profileMembershipId/d${destinyVersion}/infuse`);
    }
  }, [destinyVersion, show]);

  // Listen for items coming in via showInfuse$
  useEventBusListener(
    showInfuse$,
    useCallback(
      (item) => {
        const hasInfusables = allItems.some((i) => isInfusable(item, i));
        const hasFuel = allItems.some((i) => isInfusable(i, item));
        stateDispatch({ type: 'init', item, hasInfusables: hasInfusables, hasFuel });
      },
      [allItems],
    ),
  );

  // Close the sheet on navigation
  const { pathname } = useLocation();
  useEffect(reset, [pathname]);

  // Save direction to settings
  useEffect(() => {
    if (direction !== lastInfusionDirection) {
      setLastInfusionDirection(direction);
    }
  }, [direction, lastInfusionDirection, dispatch, setLastInfusionDirection]);

  if (!query || !currentStore) {
    return null;
  }

  const filterFn = filters(filter);

  let items = allItems.filter(
    (item) =>
      (direction === InfuseDirection.INFUSE
        ? isInfusable(query, item)
        : isInfusable(item, query)) && filterFn(item),
  );

  const dupes = items.filter((item) => item.hash === query.hash);
  dupes.sort(itemComparator);
  items = items.filter((item) => item.hash !== query.hash);
  items.sort(itemComparator);

  const preferredSource =
    dupes.find((i) => getTag(i) === 'infuse') || items.find((i) => getTag(i) === 'infuse');
  const effectiveTarget = target || dupes[0] || items[0];
  const effectiveSource = source || preferredSource || dupes[0] || items[0];

  let result: DimItem | undefined;
  if (effectiveSource?.power && effectiveTarget?.power) {
    const infused = effectiveSource.power;
    result = {
      ...effectiveTarget,
      power: infused,
      primaryStat: {
        ...effectiveTarget.primaryStat!,
        value: infused,
      },
    };
  }

  const missingItem = (
    <div className={clsx('item', styles.missingItem)}>
      <div className="item-img">
        <AppIcon icon={helpIcon} />
      </div>
      <div className="item-stat">???</div>
    </div>
  );

  const header = ({ onClose }: { onClose: () => void }) => (
    <div className={styles.infuseHeader}>
      <h1>
        {direction === InfuseDirection.INFUSE
          ? t('Infusion.InfuseTarget', {
              name: query.name,
            })
          : t('Infusion.InfuseSource', {
              name: query.name,
            })}
      </h1>
      <div className={styles.infusionControls}>
        <div className={styles.infuseTopRow}>
          <div className={styles.infusionEquation}>
            {effectiveTarget ? <ConnectedInventoryItem item={effectiveTarget} /> : missingItem}
            <div className={styles.icon}>
              <AppIcon icon={plusIcon} />
            </div>
            {effectiveSource ? <ConnectedInventoryItem item={effectiveSource} /> : missingItem}
            <div className={styles.icon}>
              <AppIcon icon={faEquals} />
            </div>
            {result ? <ConnectedInventoryItem item={result} /> : missingItem}
          </div>
          <div className={styles.infuseActions}>
            <button type="button" className="dim-button" onClick={switchDirection}>
              <AppIcon icon={faRandom} /> {t('Infusion.SwitchDirection')}
            </button>
            {result && effectiveSource && effectiveTarget && (
              <button
                type="button"
                className="dim-button"
                onClick={() =>
                  transferItems(dispatch, currentStore, onClose, effectiveSource, effectiveTarget)
                }
              >
                <AppIcon icon={faArrowCircleDown} /> {t('Infusion.TransferItems')}
              </button>
            )}
          </div>
        </div>
        <SearchBar
          className={styles.infuseSearch}
          onQueryChanged={onQueryChanged}
          placeholder={t('Infusion.Filter')}
          instant
        />
      </div>
    </div>
  );

  const renderItem = (item: DimItem) => (
    <div
      key={item.id}
      className={clsx({ [styles.infuseSelected]: item === target })}
      onClick={() => selectItem(item)}
    >
      <ConnectedInventoryItem item={item} />
    </div>
  );

  return (
    <Sheet
      onClose={reset}
      header={header}
      sheetClassName={styles.infuseDialog}
      freezeInitialHeight={true}
    >
      <div className={styles.infuseSources}>
        {items.length > 0 || dupes.length > 0 ? (
          <>
            <div className="sub-bucket">{dupes.map(renderItem)}</div>
            <div className="sub-bucket">{items.map(renderItem)}</div>
          </>
        ) : (
          <strong>{t('Infusion.NoItems')}</strong>
        )}
      </div>
    </Sheet>
  );
}

/**
 * Can source be infused into target?
 */
function isInfusable(target: DimItem, source: DimItem) {
  if (!target.infusable || !source.infusionFuel) {
    return false;
  }

  if (source.destinyVersion === 1 && target.destinyVersion === 1) {
    return source.bucket.hash === target.bucket.hash && target.power < source.power;
  }

  return (
    source.infusionCategoryHashes &&
    target.infusionCategoryHashes &&
    target.infusionCategoryHashes.some((h) => source.infusionCategoryHashes!.includes(h)) &&
    target.power < source.power
  );
}

async function transferItems(
  dispatch: DimThunkDispatch,
  currentStore: DimStore,
  onClose: () => void,
  source: DimItem,
  target: DimItem,
) {
  if (!source || !target) {
    return;
  }

  if (target.notransfer || source.notransfer) {
    const name = source.notransfer ? source.name : target.name;

    showNotification({ type: 'error', title: t('Infusion.NoTransfer', { target: name }) });
    return;
  }

  onClose();

  const items: LoadoutItem[] = [
    convertToLoadoutItem(target, false),
    // Include the source, since we wouldn't want it to get moved out of the way
    convertToLoadoutItem(source, source.equipped),
  ];

  if (source.destinyVersion === 1) {
    if (target.bucket.sort === 'General') {
      // Mote of Light
      items.push({
        id: '0',
        hash: 937555249,
        amount: 2,
        equip: false,
      });
    } else if (target.bucket.sort === 'Weapons') {
      // Weapon Parts
      items.push({
        id: '0',
        hash: 1898539128,
        amount: 10,
        equip: false,
      });
    } else {
      // Armor Materials
      items.push({
        id: '0',
        hash: 1542293174,
        amount: 10,
        equip: false,
      });
    }
    if (source.isExotic) {
      // Exotic shard
      items.push({
        id: '0',
        hash: 452597397,
        amount: 1,
        equip: false,
      });
    }
  }

  // TODO: another one where we want to respect equipped
  const loadout = newLoadout(t('Infusion.InfusionMaterials'), items);

  await dispatch(applyLoadout(currentStore, loadout));
}
