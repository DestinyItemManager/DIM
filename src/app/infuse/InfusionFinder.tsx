import React, { useEffect, useRef, useReducer } from 'react';
import './InfusionFinder.scss';
import { DimItem } from '../inventory/item-types';
import { showInfuse$ } from './infuse';
import Sheet from '../dim-ui/Sheet';
import { AppIcon, plusIcon, helpIcon, faRandom, faEquals, faArrowCircleDown } from '../shell/icons';
import ConnectedInventoryItem from '../inventory/ConnectedInventoryItem';
import copy from 'fast-copy';
import { storesSelector, currentStoreSelector } from '../inventory/selectors';
import { DimStore } from '../inventory/store-types';
import { RootState } from 'app/store/types';
import _ from 'lodash';
import { reverseComparator, compareBy, chainComparator } from '../utils/comparators';
import { newLoadout, convertToLoadoutItem } from '../loadout/loadout-utils';
import { connect } from 'react-redux';
import { t } from 'app/i18next-t';
import clsx from 'clsx';
import SearchFilterInput from '../search/SearchFilterInput';
import { SearchFilters, searchFiltersConfigSelector } from '../search/search-filter';
import { setSetting } from '../settings/actions';
import { showNotification } from '../notifications/notifications';
import { applyLoadout } from 'app/loadout/loadout-apply';
import { settingsSelector } from 'app/settings/reducer';
import { InfuseDirection, DestinyVersion } from '@destinyitemmanager/dim-api-types';
import { LoadoutItem } from 'app/loadout/loadout-types';
import { useSubscription } from 'app/utils/hooks';
import { useLocation } from 'react-router';

const itemComparator = chainComparator(
  reverseComparator(compareBy((item: DimItem) => item.primStat!.value)),
  compareBy((item: DimItem) =>
    item.isDestiny1() && item.talentGrid
      ? (item.talentGrid.totalXP / item.talentGrid.totalXPRequired) * 0.5
      : 0
  )
);

interface ProvidedProps {
  destinyVersion: DestinyVersion;
}

interface StoreProps {
  stores: DimStore[];
  currentStore: DimStore;
  filters: SearchFilters;
  lastInfusionDirection: InfuseDirection;
  isPhonePortrait: boolean;
}

function mapStateToProps(state: RootState): StoreProps {
  return {
    stores: storesSelector(state),
    currentStore: currentStoreSelector(state)!,
    filters: searchFiltersConfigSelector(state),
    lastInfusionDirection: settingsSelector(state).infusionDirection,
    isPhonePortrait: state.shell.isPhonePortrait,
  };
}

const mapDispatchToProps = {
  setSetting,
};
type DispatchProps = typeof mapDispatchToProps;

type Props = ProvidedProps & StoreProps & DispatchProps;

interface State {
  direction: InfuseDirection;
  /** The item we're focused on */
  query?: DimItem;
  /** The item that will be consumed by infusion */
  source?: DimItem;
  /** The item that will have its power increased by infusion */
  target?: DimItem;
  /** Initial height of the sheet, to prevent it resizing */
  height?: number;
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
  | { type: 'setHeight'; height: number }
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
        height: undefined,
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
    case 'setHeight': {
      return {
        ...state,
        height: action.height,
      };
    }
    case 'setFilter': {
      return {
        ...state,
        filter: action.filter,
      };
    }
  }
}

function InfusionFinder({
  stores,
  currentStore,
  filters,
  isPhonePortrait,
  lastInfusionDirection,
}: Props) {
  const itemContainer = useRef<HTMLDivElement>(null);
  const [{ direction, query, source, target, height, filter }, stateDispatch] = useReducer(
    stateReducer,
    {
      direction: lastInfusionDirection,
      filter: '',
    }
  );

  const reset = () => stateDispatch({ type: 'reset' });
  const selectItem = (item: DimItem) => stateDispatch({ type: 'selectItem', item });
  const onQueryChanged = (filter: string) => stateDispatch({ type: 'setFilter', filter });
  const switchDirection = () => stateDispatch({ type: 'swapDirection' });

  // Listen for items coming in via showInfuse#
  useSubscription(() =>
    showInfuse$.subscribe(({ item }) => {
      const hasInfusables = stores.some((store) => store.items.some((i) => isInfusable(item, i)));
      const hasFuel = stores.some((store) => store.items.some((i) => isInfusable(i, item)));
      stateDispatch({ type: 'init', item, hasInfusables: hasInfusables, hasFuel });
    })
  );

  // Track the initial height of the sheet
  useEffect(() => {
    if (itemContainer.current && !height) {
      stateDispatch({ type: 'setHeight', height: itemContainer.current.clientHeight });
    }
  }, [height]);

  // Close the sheet on navigation
  const { pathname } = useLocation();
  useEffect(reset, [pathname]);

  // Save direction to settings
  useEffect(() => {
    if (direction != lastInfusionDirection) {
      setSetting('infusionDirection', direction);
    }
  }, [direction, lastInfusionDirection]);

  if (!query) {
    return null;
  }

  const filterFn = filters.filterFunction(filter);

  let items = stores.flatMap((store) =>
    store.items.filter(
      (item) =>
        (direction === InfuseDirection.INFUSE
          ? isInfusable(query, item)
          : isInfusable(item, query)) && filterFn(item)
    )
  );

  const dupes = items.filter((item) => item.hash === query.hash);
  dupes.sort(itemComparator);
  items = items.filter((item) => item.hash !== query.hash);
  items.sort(itemComparator);

  const effectiveTarget = target || dupes[0] || items[0];
  const effectiveSource = source || dupes[0] || items[0];

  let result: DimItem | undefined;
  if (effectiveSource?.primStat && effectiveTarget?.primStat) {
    const infused = effectiveSource.primStat?.value || 0;
    result = copy(effectiveTarget);
    (result as any).primStat.value = infused;
  }

  const missingItem = (
    <div className="item missingItem">
      <div className="item-img">
        <AppIcon icon={helpIcon} />
      </div>
      <div className="item-stat">???</div>
    </div>
  );

  // On iOS at least, focusing the keyboard pushes the content off the screen
  const autoFocus =
    !isPhonePortrait && !(/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream);

  const header = ({ onClose }: { onClose(): void }) => (
    <div className="infuseHeader">
      <h1>
        {direction === InfuseDirection.INFUSE
          ? t('Infusion.InfuseTarget', {
              name: query.name,
            })
          : t('Infusion.InfuseSource', {
              name: query.name,
            })}
      </h1>
      <div className="infusionControls">
        <div className="infuseTopRow">
          <div className="infusionEquation">
            {effectiveTarget ? <ConnectedInventoryItem item={effectiveTarget} /> : missingItem}
            <div className="icon">
              <AppIcon icon={plusIcon} />
            </div>
            {effectiveSource ? <ConnectedInventoryItem item={effectiveSource} /> : missingItem}
            <div className="icon">
              <AppIcon icon={faEquals} />
            </div>
            {result ? <ConnectedInventoryItem item={result} /> : missingItem}
          </div>
          <div className="infuseActions">
            <button type="button" className="dim-button" onClick={switchDirection}>
              <AppIcon icon={faRandom} /> {t('Infusion.SwitchDirection')}
            </button>
            {result && effectiveSource && effectiveTarget && (
              <button
                type="button"
                className="dim-button"
                onClick={() =>
                  transferItems(currentStore, onClose, effectiveSource, effectiveTarget)
                }
              >
                <AppIcon icon={faArrowCircleDown} /> {t('Infusion.TransferItems')}
              </button>
            )}
          </div>
        </div>
        <div className="infuseSearch">
          <SearchFilterInput
            onQueryChanged={onQueryChanged}
            placeholder="Filter items"
            autoFocus={autoFocus}
          />
        </div>
      </div>
    </div>
  );

  return (
    <Sheet onClose={reset} header={header} sheetClassName="infuseDialog">
      <div className="infuseSources" ref={itemContainer} style={{ height }}>
        {items.length > 0 || dupes.length > 0 ? (
          <>
            <div className="sub-bucket">
              {dupes.map((item) => (
                <div
                  key={item.id}
                  className={clsx({ 'infuse-selected': item === target })}
                  onClick={() => selectItem(item)}
                >
                  <ConnectedInventoryItem item={item} />
                </div>
              ))}
            </div>
            <div className="sub-bucket">
              {items.map((item) => (
                <div
                  key={item.id}
                  className={clsx({ 'infuse-selected': item === target })}
                  onClick={() => selectItem(item)}
                >
                  <ConnectedInventoryItem item={item} />
                </div>
              ))}
            </div>
          </>
        ) : (
          <strong>{t('Infusion.NoItems')}</strong>
        )}
      </div>
    </Sheet>
  );
}

export default connect<StoreProps, DispatchProps>(
  mapStateToProps,
  mapDispatchToProps
)(InfusionFinder);

/**
 * Can source be infused into target?
 */
function isInfusable(target: DimItem, source: DimItem) {
  if (!target.infusable || !source.infusionFuel) {
    return false;
  }

  if (source.isDestiny1() && target.isDestiny1()) {
    return source.type === target.type && target.primStat!.value < source.primStat!.value;
  } else if (source.isDestiny2() && target.isDestiny2()) {
    return (
      source.infusionQuality &&
      target.infusionQuality &&
      target.infusionQuality.infusionCategoryHashes.some((h) =>
        source.infusionQuality!.infusionCategoryHashes.includes(h)
      ) &&
      target.basePower < source.basePower
    );
  }

  // Don't try to apply logic for unknown Destiny versions.
  return false;
}

async function transferItems(
  currentStore: DimStore,
  onClose: () => void,
  source: DimItem,
  target: DimItem
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

  if (source.isDestiny1()) {
    if (target.bucket.sort === 'General') {
      // Mote of Light
      items.push({
        id: '0',
        hash: 937555249,
        amount: 2,
        equipped: false,
      });
    } else if (target.bucket.sort === 'Weapons') {
      // Weapon Parts
      items.push({
        id: '0',
        hash: 1898539128,
        amount: 10,
        equipped: false,
      });
    } else {
      // Armor Materials
      items.push({
        id: '0',
        hash: 1542293174,
        amount: 10,
        equipped: false,
      });
    }
    if (source.isExotic) {
      // Exotic shard
      items.push({
        id: '0',
        hash: 452597397,
        amount: 1,
        equipped: false,
      });
    }
  }

  // TODO: another one where we want to respect equipped
  const loadout = newLoadout(t('Infusion.InfusionMaterials'), items);

  await applyLoadout(currentStore, loadout);
}
