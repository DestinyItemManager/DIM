import * as React from 'react';
import './infuse.scss';
import { DimItem } from '../inventory/item-types';
import { showInfuse$ } from './infuse';
import { Subscriptions } from '../rx-utils';
import { router } from '../../router';
import Sheet from '../dim-ui/Sheet';
import { AppIcon, plusIcon, helpIcon } from '../shell/icons';
import ConnectedInventoryItem from '../inventory/ConnectedInventoryItem';
import { getDefinitions, D1ManifestDefinitions } from '../destiny1/d1-definitions.service';
import copy from 'fast-copy';
import { storesSelector } from '../inventory/reducer';
import { DimStore } from '../inventory/store-types';
import { RootState } from '../store/reducers';
import * as _ from 'lodash';
import { reverseComparator, compareBy, chainComparator } from '../comparators';
import { toaster } from '../ngimport-more';
import { newLoadout } from '../loadout/loadout-utils';
import { connect } from 'react-redux';
import { t } from 'i18next';
import { dimLoadoutService } from '../loadout/loadout.service';
import classNames from 'classnames';
import { faRandom, faEquals, faArrowCircleDown } from '@fortawesome/free-solid-svg-icons';
import SearchFilterInput from '../search/SearchFilterInput';
import {
  SearchConfig,
  searchConfigSelector,
  SearchFilters,
  searchFiltersConfigSelector
} from '../search/search-filters';

const itemComparator = chainComparator(
  reverseComparator(compareBy((item: DimItem) => item.primStat!.value)),
  compareBy((item: DimItem) =>
    item.isDestiny1() && item.talentGrid
      ? (item.talentGrid.totalXP / item.talentGrid.totalXPRequired) * 0.5
      : 0
  )
);

interface ProvidedProps {
  destinyVersion: 1 | 2;
}

interface StoreProps {
  stores: DimStore[];
  searchConfig: SearchConfig;
  filters: SearchFilters;
}

function mapStateToProps(state: RootState): StoreProps {
  return {
    stores: storesSelector(state),
    searchConfig: searchConfigSelector(state),
    filters: searchFiltersConfigSelector(state)
  };
}

type Props = ProvidedProps & StoreProps;

enum Direction {
  /** infuse the query into the target (query = source) */
  INFUSE,
  /** infuse something into the query (query = target) */
  FUEL
}

interface State {
  query?: DimItem;
  source?: DimItem;
  target?: DimItem;
  defs?: D1ManifestDefinitions;
  direction: Direction;
  filter: string;
}

class InfusionFinder extends React.Component<Props, State> {
  state: State = { direction: Direction.INFUSE, filter: '' };
  private subscriptions = new Subscriptions();
  // tslint:disable-next-line:ban-types
  private unregisterTransitionHook?: Function;
  private itemContainer = React.createRef<HTMLDivElement>();

  componentDidMount() {
    this.subscriptions.add(
      showInfuse$.subscribe(({ item }) => {
        this.setState({
          query: item,
          source: item,
          target: undefined,
          direction: Direction.INFUSE
        });
      })
    );
    this.unregisterTransitionHook = router.transitionService.onBefore({}, () => this.onClose());

    if (this.itemContainer.current) {
      this.setState({ height: this.itemContainer.current.clientHeight });
    }
  }

  componentDidUpdate(prevProps) {
    if (prevProps.destinyVersion !== 1 && this.props.destinyVersion === 1 && !this.state.defs) {
      getDefinitions().then((defs) => this.setState({ defs }));
    }

    if (this.itemContainer.current && !this.state.height) {
      this.setState({ height: this.itemContainer.current.clientHeight });
    }
  }

  componentWillUnmount() {
    this.subscriptions.unsubscribe();
    if (this.unregisterTransitionHook) {
      this.unregisterTransitionHook();
      this.unregisterTransitionHook = undefined;
    }
  }

  render() {
    // TODO: make a connected subcomponent
    const { stores, searchConfig, filters } = this.props;
    const { source, query, direction, filter } = this.state;
    let { target } = this.state;

    if (!query) {
      return null;
    }

    // TODO: cache this?
    let items: DimItem[] = [];
    if (direction === Direction.INFUSE) {
      const targetItems = _.flatMap(stores, (store) =>
        store.items.filter((item) => isInfusable(query, item))
      );
      items = targetItems;
    } else {
      const sourceItems = _.flatMap(stores, (store) =>
        store.items.filter((item) => isInfusable(item, query))
      );
      items = sourceItems;
    }

    const dupes = items.filter((item) => item.hash === query.hash);
    items = items.filter((item) => item.hash !== query.hash);

    const filterFn = filters.filterFunction(filter);

    items = items.filter(filterFn).sort(itemComparator);

    target = target || items[0];

    let infused = target && target.primStat ? target.primStat.value : 0;
    let result: DimItem | undefined;

    if (source && target && source.primStat && target.primStat) {
      if (source.isDestiny2()) {
        infused = target.basePower + (source.primStat!.value - source.basePower);
      }

      result = copy(source);
      // TODO:
      (result as any).primStat.value = infused;
    }

    console.log({ target, result });

    const missingItem = (
      <div className="item missingItem">
        <div className="item-img">
          <AppIcon icon={helpIcon} />
        </div>
        <div className="item-stat">???</div>
      </div>
    );

    const header = (
      <div className="infuseHeader">
        <h1>
          {t(direction === Direction.INFUSE ? 'Infusion.InfuseTarget' : 'Infusion.InfuseSource', {
            name: query.name
          })}
        </h1>
        <div className="infusionEquation">
          {source ? <ConnectedInventoryItem item={source} /> : missingItem}
          {target ? (
            <>
              <div className="icon">
                <AppIcon icon={plusIcon} />
              </div>
              <ConnectedInventoryItem item={target} />
              {result && (
                <>
                  <div className="icon">
                    <AppIcon icon={faEquals} />
                  </div>
                  <ConnectedInventoryItem item={result} />
                </>
              )}
            </>
          ) : (
            missingItem
          )}
          <div className="infuseActions">
            <button className="dim-button" onClick={this.switchDirection}>
              <AppIcon icon={faRandom} /> Switch Direction
            </button>
            {result && (
              <button className="dim-button" onClick={this.transferItems}>
                <AppIcon icon={faArrowCircleDown} /> Transfer
              </button>
            )}
          </div>
          <div className="infuseSearch">
            <SearchFilterInput
              searchConfig={searchConfig}
              onQueryChanged={this.onQueryChanged}
              placeholder="Filter items"
            />
          </div>
        </div>
      </div>
    );

    return (
      <Sheet onClose={this.onClose} header={header} sheetClassName="infuseDialog">
        <div className="infuseSources">
          {items.length > 0 ? (
            <>
              <div className="itemGrid">
                {dupes.map((item) => (
                  <div
                    key={item.id}
                    className={classNames({ 'infuse-selected': item === target })}
                    onClick={() => this.setSourceAndTarget(query, item)}
                  >
                    <ConnectedInventoryItem item={item} />
                  </div>
                ))}
              </div>
              <div className="itemGrid">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className={classNames({ 'infuse-selected': item === target })}
                    onClick={() => this.setSourceAndTarget(query, item)}
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
    this.setState({ query: undefined, source: undefined, target: undefined });
  };

  private setSourceAndTarget = (source: DimItem, target: DimItem) => {
    this.setState({ source, target });
  };

  private onQueryChanged = (filter: string) => {
    this.setState({ filter });
  };

  private switchDirection = () => {
    const direction = this.state.direction === Direction.INFUSE ? Direction.FUEL : Direction.INFUSE;
    this.setState({
      direction,
      source: direction === Direction.INFUSE ? this.state.query : undefined,
      target: direction === Direction.FUEL ? this.state.query : undefined
    });
  };

  private transferItems = async () => {
    const { source, target } = this.state;
    if (!source || !target) {
      return;
    }

    if (target.notransfer || source.notransfer) {
      const name = source.notransfer ? source.name : target.name;

      toaster.pop('error', t('Infusion.NoTransfer', { target: name }));
      return;
    }

    const store = source.getStoresService().getActiveStore()!;
    const items: { [key: string]: any[] } = {};
    const targetKey = target.type.toLowerCase();
    items[targetKey] = items[targetKey] || [];
    const itemCopy = copy(target);
    itemCopy.equipped = false;
    items[targetKey].push(itemCopy);
    // Include the source, since we wouldn't want it to get moved out of the way
    const sourceKey = source.type.toLowerCase();
    items[sourceKey] = items[sourceKey] || [];
    items[sourceKey].push(source);

    items.material = [];
    if (target.bucket.sort === 'General') {
      // Mote of Light
      items.material.push({
        id: '0',
        hash: 937555249,
        amount: 2,
        equipped: false
      });
    } else if (source.isDestiny1() && source.primStat!.stat.statIdentifier === 'STAT_DAMAGE') {
      // Weapon Parts
      items.material.push({
        id: '0',
        hash: 1898539128,
        amount: 10,
        equipped: false
      });
    } else {
      // Armor Materials
      items.material.push({
        id: '0',
        hash: 1542293174,
        amount: 10,
        equipped: false
      });
    }
    if (source.isExotic) {
      // Exotic shard
      items.material.push({
        id: '0',
        hash: 452597397,
        amount: 1,
        equipped: false
      });
    }

    const loadout = newLoadout(t('Infusion.InfusionMaterials'), items);

    return dimLoadoutService.applyLoadout(store, loadout);
  };
}

export default connect<StoreProps>(mapStateToProps)(InfusionFinder);

/**
 * Can source be infused into target?
 */
function isInfusable(source: DimItem, target: DimItem) {
  if (!source.infusable || !target.infusionFuel) {
    return false;
  }

  if (source.isDestiny1() && target.isDestiny2()) {
    return source.type === target.type && source.primStat!.value < target.primStat!.value;
  } else if (source.isDestiny2() && target.isDestiny2()) {
    return (
      source.infusionQuality &&
      target.infusionQuality &&
      source.infusionQuality.infusionCategoryHashes.some((h) =>
        target.infusionQuality!.infusionCategoryHashes.includes(h)
      ) &&
      source.basePower < target.basePower
    );
  }

  // Don't try to apply logic for unknown Destiny versions.
  return false;
}
