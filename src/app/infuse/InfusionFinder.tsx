import * as React from 'react';
import './infuse.scss';
import { DimItem } from '../inventory/item-types';
import { showInfuse$ } from './infuse';
import { Subscriptions } from '../rx-utils';
import { router } from '../../router';
import Sheet from '../dim-ui/Sheet';
import { AppIcon, plusIcon, rightArrowIcon, boltIcon } from '../shell/icons';
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
  INFUSE,
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
          source: undefined,
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
    const { source, target, direction } = this.state;

    if (!source) {
      return null;
    }

    let infused = target && target.primStat ? target.primStat.value : 0;
    let result;

    let wildcardMaterialCost = 0;
    let wildcardMaterialHash = 0;
    if (source && target && source.primStat && target.primStat) {
      if (source.isDestiny2()) {
        infused = target.basePower + (source.primStat!.value - source.basePower);
      } else if (source.bucket.sort === 'General') {
        wildcardMaterialCost = 2;
        wildcardMaterialHash = 937555249;
      } else if (source.isDestiny1() && source.primStat!.stat.statIdentifier === 'STAT_DAMAGE') {
        wildcardMaterialCost = 10;
        wildcardMaterialHash = 1898539128;
      } else {
        wildcardMaterialCost = 10;
        wildcardMaterialHash = 1542293174;
      }

      result = copy(source);
      result.primStat.value = infused;
    }

    const query = source;

    let items: DimItem[] = [];
    let dupes: DimItem[] = [];
    if (direction === Direction.INFUSE) {
      if (query.infusable) {
        let targetItems = _.flatMap(stores, (store) => {
          return store.items.filter((item) => isInfusable(query, item));
        });
        targetItems = targetItems.sort(itemComparator);

        dupes = targetItems.filter((item) => item.hash === query.hash);
        items = targetItems.filter((item) => item.hash !== query.hash);
      }
    } else {
      if (query.infusionFuel) {
        let sourceItems = _.flatMap(stores, (store) => {
          return store.items.filter((item) => {
            return isInfusable(item, query);
          });
        });
        sourceItems = sourceItems.sort(itemComparator);

        dupes = sourceItems.filter((item) => item.hash === query.hash);
        items = sourceItems.filter((item) => item.hash !== query.hash);
      }
    }

    const header = (
      <div className="infuseHeader">
        <div className="infusionEquation">
          <ConnectedInventoryItem item={source} />
          {target && (
            <>
              <div className="icon">
                <AppIcon icon={plusIcon} />
                <AppIcon icon={boltIcon} />
              </div>
              <ConnectedInventoryItem item={target} />
              <div className="icon">
                <AppIcon icon={rightArrowIcon} />
              </div>
              <ConnectedInventoryItem item={result} />
            </>
          )}
          {wildcardMaterialCost} {wildcardMaterialHash}
          <button onClick={this.transferItems}>Transfer</button>
        </div>
      </div>
    );

    return (
      <Sheet onClose={this.onClose} header={header}>
        <div className="infuseSources">
          {items.length > 0 ? (
            <>
              {dupes.length > 0 && t('Infusion.InfuseSource', { name: query.name })}
              <div className="itemGrid">
                {dupes.map((item) => (
                  <div
                    className={classNames({ 'infuse-selected': item === source })}
                    onClick={() => this.setSourceAndTarget(item, query)}
                  >
                    <ConnectedInventoryItem item={item} />
                  </div>
                ))}
              </div>
              <div className="itemGrid">
                {items.map((item) => (
                  <div
                    className={classNames({ 'infuse-selected': item === source })}
                    onClick={() => this.setSourceAndTarget(item, query)}
                  >
                    <ConnectedInventoryItem item={item} />
                  </div>
                ))}
              </div>
            </>
          ) : (
            <strong ng-i18next="Infusion.NoItems" />
          )}
        </div>
      </Sheet>
    );
  }

  private onClose = () => {
    this.setState({ query: undefined, source: undefined, target: undefined });
  };

  private setSourceAndTarget(source: DimItem, target: DimItem) {
    this.setState({ source, target });
  }

  private async transferItems() {
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
  }
}

export default connect<StoreProps>(mapStateToProps)(InfusionFinder);

/**
 * Can source be infused into target?
 */
function isInfusable(source: DimItem, target: DimItem) {
  if (!source.infusable || !target.infusionFuel) {
    return false;
  }

  if (source.destinyVersion !== target.destinyVersion) {
    return false;
  }

  if (source.isDestiny1()) {
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
