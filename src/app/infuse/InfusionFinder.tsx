import React from 'react';
import './InfusionFinder.scss';
import { DimItem } from '../inventory/item-types';
import { showInfuse$ } from './infuse';
import { Subscriptions } from '../utils/rx-utils';
import Sheet from '../dim-ui/Sheet';
import { AppIcon, plusIcon, helpIcon, faRandom, faEquals, faArrowCircleDown } from '../shell/icons';
import ConnectedInventoryItem from '../inventory/ConnectedInventoryItem';
import copy from 'fast-copy';
import { storesSelector, currentStoreSelector } from '../inventory/selectors';
import { DimStore } from '../inventory/store-types';
import { RootState } from '../store/reducers';
import _ from 'lodash';
import { reverseComparator, compareBy, chainComparator } from '../utils/comparators';
import { newLoadout, convertToLoadoutItem } from '../loadout/loadout-utils';
import { connect } from 'react-redux';
import { t } from 'app/i18next-t';
import clsx from 'clsx';
import SearchFilterInput from '../search/SearchFilterInput';
import {
  SearchConfig,
  searchConfigSelector,
  SearchFilters,
  searchFiltersConfigSelector
} from '../search/search-filters';
import { setSetting } from '../settings/actions';
import { showNotification } from '../notifications/notifications';
import { applyLoadout } from 'app/loadout/loadout-apply';
import { settingsSelector } from 'app/settings/reducer';
import { InfuseDirection, DestinyVersion } from '@destinyitemmanager/dim-api-types';
import { LoadoutItem } from 'app/loadout/loadout-types';
import { RouteComponentProps, withRouter } from 'react-router';

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
  searchConfig: SearchConfig;
  filters: SearchFilters;
  lastInfusionDirection: InfuseDirection;
  isPhonePortrait: boolean;
}

function mapStateToProps(state: RootState): StoreProps {
  return {
    stores: storesSelector(state),
    currentStore: currentStoreSelector(state)!,
    searchConfig: searchConfigSelector(state),
    filters: searchFiltersConfigSelector(state),
    lastInfusionDirection: settingsSelector(state).infusionDirection,
    isPhonePortrait: state.shell.isPhonePortrait
  };
}

const mapDispatchToProps = {
  setSetting
};
type DispatchProps = typeof mapDispatchToProps;

type Props = ProvidedProps & StoreProps & DispatchProps & RouteComponentProps;

interface State {
  query?: DimItem;
  source?: DimItem;
  target?: DimItem;
  direction: InfuseDirection;
  filter: string;
  height?: number;
}

class InfusionFinder extends React.Component<Props, State> {
  state: State = { direction: InfuseDirection.INFUSE, filter: '' };
  private subscriptions = new Subscriptions();
  private itemContainer = React.createRef<HTMLDivElement>();

  componentDidMount() {
    this.subscriptions.add(
      showInfuse$.subscribe(({ item }) => {
        const hasInfusables = () =>
          this.props.stores.some((store) => store.items.some((i) => Boolean(isInfusable(item, i))));
        const hasFuel = () =>
          this.props.stores.some((store) => store.items.some((i) => Boolean(isInfusable(i, item))));

        const direction =
          this.props.lastInfusionDirection === InfuseDirection.INFUSE
            ? hasInfusables()
              ? InfuseDirection.INFUSE
              : InfuseDirection.FUEL
            : hasFuel()
            ? InfuseDirection.FUEL
            : InfuseDirection.INFUSE;

        if (direction === InfuseDirection.INFUSE) {
          this.setState({
            query: item,
            source: undefined,
            target: item,
            direction: InfuseDirection.INFUSE,
            height: undefined,
            filter: ''
          });
        } else {
          this.setState({
            query: item,
            source: item,
            target: undefined,
            direction: InfuseDirection.FUEL,
            height: undefined,
            filter: ''
          });
        }
      })
    );

    if (this.itemContainer.current) {
      this.setState({ height: this.itemContainer.current.clientHeight });
    }
  }

  componentDidUpdate(prevProps: Props) {
    if (this.itemContainer.current && !this.state.height) {
      this.setState({ height: this.itemContainer.current.clientHeight });
    }
    if (prevProps.location.pathname !== this.props.location.pathname) {
      this.onClose();
    }
  }

  componentWillUnmount() {
    this.subscriptions.unsubscribe();
  }

  render() {
    const { stores, searchConfig, filters, isPhonePortrait } = this.props;
    const { query, direction, filter, height } = this.state;
    let { target, source } = this.state;

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

    target = target || dupes[0] || items[0];
    source = source || dupes[0] || items[0];

    let result: DimItem | undefined;
    if (source && target && source.primStat && target.primStat) {
      const infused = source.primStat?.value || 0;
      result = copy(target);
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
                name: query.name
              })
            : t('Infusion.InfuseSource', {
                name: query.name
              })}
        </h1>
        <div className="infusionControls">
          <div className="infuseTopRow">
            <div className="infusionEquation">
              {target ? <ConnectedInventoryItem item={target} /> : missingItem}
              <div className="icon">
                <AppIcon icon={plusIcon} />
              </div>
              {source ? <ConnectedInventoryItem item={source} /> : missingItem}
              <div className="icon">
                <AppIcon icon={faEquals} />
              </div>
              {result ? <ConnectedInventoryItem item={result} /> : missingItem}
            </div>
            <div className="infuseActions">
              <button className="dim-button" onClick={this.switchDirection}>
                <AppIcon icon={faRandom} /> {t('Infusion.SwitchDirection')}
              </button>
              {result && source && target && (
                <button
                  className="dim-button"
                  onClick={() => this.transferItems(onClose, source!, target!)}
                >
                  <AppIcon icon={faArrowCircleDown} /> {t('Infusion.TransferItems')}
                </button>
              )}
            </div>
          </div>
          <div className="infuseSearch">
            <SearchFilterInput
              searchConfig={searchConfig}
              onQueryChanged={this.onQueryChanged}
              placeholder="Filter items"
              autoFocus={autoFocus}
            />
          </div>
        </div>
      </div>
    );

    return (
      <Sheet onClose={this.onClose} header={header} sheetClassName="infuseDialog">
        <div className="infuseSources" ref={this.itemContainer} style={{ height }}>
          {items.length > 0 || dupes.length > 0 ? (
            <>
              <div className="sub-bucket">
                {dupes.map((item) => (
                  <div
                    key={item.id}
                    className={clsx({ 'infuse-selected': item === target })}
                    onClick={() => this.setSourceAndTarget(item, query)}
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
                    onClick={() => this.setSourceAndTarget(item, query)}
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

  private onClose = () => {
    this.setState({
      query: undefined,
      source: undefined,
      target: undefined,
      height: undefined,
      filter: ''
    });
  };

  private setSourceAndTarget = (source: DimItem, target: DimItem) => {
    if (this.state.direction === InfuseDirection.INFUSE) {
      this.setState({ source, target });
    } else {
      this.setState({ source: target, target: source });
    }
  };

  private onQueryChanged = (filter: string) => {
    this.setState({ filter });
  };

  private switchDirection = () => {
    this.setState(({ direction: oldDirection, query }) => {
      const direction =
        oldDirection === InfuseDirection.INFUSE ? InfuseDirection.FUEL : InfuseDirection.INFUSE;
      return {
        direction,
        target: direction === InfuseDirection.INFUSE ? query : undefined,
        source: direction === InfuseDirection.FUEL ? query : undefined
      };
    });
    this.props.setSetting('infusionDirection', 1);
  };

  private transferItems = async (onClose: () => void, source: DimItem, target: DimItem) => {
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
      convertToLoadoutItem(source, source.equipped)
    ];

    if (source.isDestiny1()) {
      if (target.bucket.sort === 'General') {
        // Mote of Light
        items.push({
          id: '0',
          hash: 937555249,
          amount: 2,
          equipped: false
        });
      } else if (target.bucket.sort === 'Weapons') {
        // Weapon Parts
        items.push({
          id: '0',
          hash: 1898539128,
          amount: 10,
          equipped: false
        });
      } else {
        // Armor Materials
        items.push({
          id: '0',
          hash: 1542293174,
          amount: 10,
          equipped: false
        });
      }
      if (source.isExotic) {
        // Exotic shard
        items.push({
          id: '0',
          hash: 452597397,
          amount: 1,
          equipped: false
        });
      }
    }

    // TODO: another one where we want to respect equipped
    const loadout = newLoadout(t('Infusion.InfusionMaterials'), items);

    await applyLoadout(this.props.currentStore, loadout);
  };
}

export default withRouter(
  connect<StoreProps, DispatchProps>(mapStateToProps, mapDispatchToProps)(InfusionFinder)
);

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
