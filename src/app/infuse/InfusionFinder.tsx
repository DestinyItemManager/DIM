import * as React from 'react';
import './infuse.scss';
import { DimItem } from '../inventory/item-types';
import { showInfuse$ } from './infuse';
import { Subscriptions } from '../rx-utils';
import { router } from '../../router';
import Sheet from '../dim-ui/Sheet';
import { AppIcon, plusIcon, rightArrowIcon } from '../shell/icons';
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
}

function mapStateToProps(state: RootState): StoreProps {
  return {
    stores: storesSelector(state)
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
}

class InfusionFinder extends React.Component<Props, State> {
  state: State = { direction: Direction.INFUSE };
  private subscriptions = new Subscriptions();
  // tslint:disable-next-line:ban-types
  private unregisterTransitionHook?: Function;

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
  }

  componentDidUpdate(prevProps) {
    if (prevProps.destinyVersion !== 1 && this.props.destinyVersion === 1 && !this.state.defs) {
      getDefinitions().then((defs) => this.setState({ defs }));
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
    const { stores } = this.props;
    const { source, query, direction } = this.state;
    let { target } = this.state;

    if (!query) {
      return null;
    }

    let infused = target && target.primStat ? target.primStat.value : 0;
    let result;

    if (source && target && source.primStat && target.primStat) {
      if (source.isDestiny2()) {
        infused = target.basePower + (source.primStat!.value - source.basePower);
      }

      result = copy(source);
      result.primStat.value = infused;
    }

    // TODO: cache this?
    let items: DimItem[] = [];
    if (direction === Direction.INFUSE) {
      const targetItems = _.flatMap(stores, (store) =>
        store.items.filter((item) => isInfusable(query, item))
      );
      items = targetItems.sort(itemComparator);
    } else {
      const sourceItems = _.flatMap(stores, (store) =>
        store.items.filter((item) => isInfusable(item, query))
      );
      items = sourceItems.sort(itemComparator);
    }

    const dupes = items.filter((item) => item.hash === query.hash);
    items = items.filter((item) => item.hash !== query.hash);

    target = target || items[0];

    const header = (
      <div className="infuseHeader">
        <div className="infusionEquation">
          {source && <ConnectedInventoryItem item={source} />}
          {target && (
            <>
              <div className="icon">
                <AppIcon icon={plusIcon} />
                <button onClick={this.switchDirection}>Switch</button>
              </div>
              <ConnectedInventoryItem item={target} />
              <div className="icon">
                <AppIcon icon={rightArrowIcon} />
              </div>
              <ConnectedInventoryItem item={result} />
            </>
          )}
          <button onClick={this.transferItems}>Transfer</button>

          <h1>
            {t(direction === Direction.INFUSE ? 'Infusion.InfuseTarget' : 'Infusion.InfuseSource', {
              name: query.name
            })}
          </h1>
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
