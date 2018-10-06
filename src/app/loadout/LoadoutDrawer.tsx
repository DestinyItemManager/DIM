import { t } from 'i18next';
import * as React from 'react';
import InventoryItem from '../inventory/InventoryItem';
import { toaster } from '../ngimport-more';
import { dimLoadoutService, Loadout } from './loadout.service';
import * as _ from 'underscore';
import { $rootScope } from 'ngimport';
import { sortItems } from '../shell/dimAngularFilters.filter';
import copy from 'fast-copy';
import { flatMap } from '../util';
import { getDefinitions as getD1Definitions } from '../destiny1/d1-definitions.service';
import { getDefinitions as getD2Definitions } from '../destiny2/d2-definitions.service';
import { DimItem } from '../inventory/item-types';
import uuidv4 from 'uuid/v4';
import { D2Categories } from '../destiny2/d2-buckets.service';
import { D1Categories } from '../destiny1/d1-buckets.service';
import { router } from '../../router';
import { RootState } from '../store/reducers';
import { itemSortOrderSelector } from '../settings/item-sort';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import { destinyVersionSelector } from '../accounts/reducer';
import { storesSelector } from '../inventory/reducer';
import spartan from '../../images/spartan.png';
import LoadoutDrawerDropTarget from './LoadoutDrawerDropTarget';
import { InventoryBuckets } from '../inventory/inventory-buckets';
import './loadout-drawer.scss';

interface StoreProps {
  types: string[];
  itemSortOrder: string[];
  destinyVersion: 1 | 2;
  classTypeOptions: {
    label: string;
    value: number;
  }[];
  storeIds: string[];
  buckets: InventoryBuckets;
}

type Props = StoreProps;

interface State {
  loadout?: Loadout;
  warnitems: DimItem[];
  show: boolean;
}

const typesSelector = createSelector(destinyVersionSelector, (destinyVersion) => {
  const dimItemCategories = destinyVersion === 2 ? D2Categories : D1Categories;
  return _.flatten(Object.values(dimItemCategories)).map((t) => t.toLowerCase());
});

const classTypeOptionsSelector = createSelector(storesSelector, (stores) => {
  const classTypeValues: {
    label: string;
    value: number;
  }[] = [{ label: t('Loadouts.Any'), value: -1 }];
  _.each(_.uniq(stores.filter((s) => !s.isVault), false, (store) => store.classType), (store) => {
    let classType = 0;

    /*
      Bug here was localization tried to change the label order, but users have saved their loadouts with data that was in the original order.
      These changes broke loadouts.  Next time, you have to map values between new and old values to preserve backwards compatability.
      */
    switch (parseInt(store.classType.toString(), 10)) {
      case 0: {
        classType = 1;
        break;
      }
      case 1: {
        classType = 2;
        break;
      }
      case 2: {
        classType = 0;
        break;
      }
    }

    classTypeValues.push({ label: store.className, value: classType });
  });
  return classTypeValues;
});

const storeIdsSelector = createSelector(storesSelector, (stores) => stores.map((s) => s.id));

function mapStateToProps(state: RootState): StoreProps {
  return {
    itemSortOrder: itemSortOrderSelector(state),
    types: typesSelector(state),
    destinyVersion: destinyVersionSelector(state),
    classTypeOptions: classTypeOptionsSelector(state),
    storeIds: storeIdsSelector(state),
    buckets: state.inventory.buckets!
  };
}

class LoadoutDrawer extends React.Component<Props, State> {
  state: State = {
    warnitems: [],
    show: false
  };
  private $scope = $rootScope.$new(true);
  // tslint:disable-next-line:ban-types
  private listener: Function;

  componentDidMount() {
    this.listener = router.transitionService.onExit({}, () => {
      this.close();
    });

    this.$scope.$on('dim-edit-loadout', (_event, args: { loadout: Loadout; equipAll: boolean }) => {
      const loadout = copy(args.loadout);
      dimLoadoutService.dialogOpen = true;
      if (loadout.classType === undefined) {
        loadout.classType = -1;
      }
      loadout.items = loadout.items || {};

      // Filter out any vendor items and equip all if requested
      const warnitems = flatMap(Object.values(loadout.items), (items) =>
        items.filter((item) => !item.owner)
      );
      this.fillInDefinitionsForWarnItems(this.props.destinyVersion, warnitems);

      // TODO: find equivalent items for warnitems
      // tricky part, we only have hash!

      _.each(loadout.items, (items, type) => {
        loadout.items[type] = items.filter((item) => item.owner);
        if (args.equipAll && loadout.items[type][0]) {
          loadout.items[type][0].equipped = true;
        }
      });

      // TODO: match up items with real store items!

      this.setState({
        show: true,
        loadout,
        warnitems
      });
    });

    this.$scope.$on('dim-store-item-clicked', (_event, args) => {
      this.add(args.item, args.clickEvent);
    });
  }

  componentWillUnmount() {
    this.$scope.$destroy();
    this.listener();
  }

  render() {
    const { types, buckets, itemSortOrder, classTypeOptions, storeIds } = this.props;
    const { show, loadout, warnitems } = this.state;

    if (!loadout || !show) {
      return null;
    }

    // TODO: remove angular events

    // TODO: show class if anything can be multi-class?
    const showClass = true;

    // TODO: take this from the event
    const isNew = false;

    // TODO: animation

    const bucketTypes = Object.keys(buckets.byType);

    return (
      <div id="loadout-drawer" className="loadout-create">
        <div className="loadout-content">
          <div id="loadout-options">
            <form name="vm.form" onSubmit={this.saveLoadout}>
              <input
                className="dim-input"
                name="name"
                onChange={this.setName}
                minLength={1}
                maxLength={50}
                required={true}
                type="search"
                placeholder={t('Loadouts.LoadoutName')}
              />{' '}
              {showClass && (
                <select name="classType" onChange={this.setClassType}>
                  {classTypeOptions.map((option) => (
                    <option key={option.value} label={option.label} value={option.value} />
                  ))}
                </select>
              )}{' '}
              <button
                className="dim-button"
                disabled={!loadout.name.length || _.isEmpty(loadout.items)}
              >
                {t('Loadouts.Save')}
              </button>{' '}
              {!isNew && (
                <button className="dim-button" onClick={this.saveAsNew}>
                  {t('Loadouts.SaveAsNew')}
                </button>
              )}{' '}
              <button className="dim-button" onClick={this.close}>
                <span>{t('Loadouts.Cancel')}</span> <i className="fa fa-close" />
              </button>{' '}
              <span>
                <img src={spartan} className="loadout-equip-help" />
                <span>{t('Loadouts.ItemsWithIcon')}</span>
              </span>
            </form>
          </div>
          <LoadoutDrawerDropTarget
            bucketTypes={bucketTypes}
            storeIds={storeIds}
            onDroppedItem={this.add}
          >
            {warnitems.length > 0 && (
              <>
                <p>{t('Loadouts.VendorsCannotEquip')}</p>
                <div className="loadout-contents">
                  {warnitems.map((item) => (
                    <div key={item.id} className="loadout-item">
                      <InventoryItem item={item} />
                      <div className="close" onClick={() => this.removeWarnItem(item)} />
                      <div className="fa warn" />
                    </div>
                  ))}
                </div>
                <p>{t('Loadouts.VendorsCanEquip')}</p>
              </>
            )}
            <div className="loadout-contents">
              {types.map(
                (value) =>
                  loadout.items[value] &&
                  loadout.items[value].length > 0 && (
                    <div key={value} className={`loadout-${value} loadout-bucket`}>
                      {sortItems(loadout.items[value], itemSortOrder).map((item) => (
                        <div
                          key={item.id}
                          onClick={() => this.equip(item)}
                          className="loadout-item"
                        >
                          <InventoryItem item={item} />
                          <div className="close" onClick={(e) => this.remove(item, e)} />
                          {item.equipped && <div className="equipped" ng-show="item.equipped" />}
                        </div>
                      ))}
                    </div>
                  )
              )}
            </div>
          </LoadoutDrawerDropTarget>
        </div>
      </div>
    );
  }

  private add = (item: DimItem, e?: MouseEvent) => {
    console.log('ADD!', item);
    const { loadout } = this.state;
    if (!loadout) {
      return;
    }
    if (item.canBeInLoadout()) {
      const clone = copy(item);

      const discriminator = clone.type.toLowerCase();
      const typeInventory = (loadout.items[discriminator] = loadout.items[discriminator] || []);

      clone.amount = Math.min(clone.amount, e && e.shiftKey ? 5 : 1);

      const dupe = _.find(typeInventory, { hash: clone.hash, id: clone.id });

      let maxSlots = 10;
      if (item.type === 'Material') {
        maxSlots = 20;
      } else if (item.type === 'Consumable') {
        maxSlots = 19;
      }

      if (!dupe) {
        if (typeInventory.length < maxSlots) {
          clone.equipped = item.equipment && typeInventory.length === 0;

          // Only allow one subclass per burn
          if (clone.type === 'Class') {
            const other = loadout.items.class;
            if (other && other.length && other[0].dmg !== clone.dmg) {
              loadout.items.class.splice(0, loadout.items.class.length);
            }
            clone.equipped = true;
          }

          typeInventory.push(clone);
        } else {
          toaster.pop('warning', '', t('Loadouts.MaxSlots', { slots: maxSlots }));
        }
      } else if (dupe && clone.maxStackSize > 1) {
        const increment = Math.min(dupe.amount + clone.amount, dupe.maxStackSize) - dupe.amount;
        dupe.amount += increment;
        // TODO: handle stack splits
      }
      console.log(loadout);

      this.setState({ loadout });
    } else {
      toaster.pop('warning', '', t('Loadouts.OnlyItems'));
    }
  };

  private remove = (item, $event) => {
    const { loadout } = this.state;

    if (!loadout) {
      return;
    }
    const discriminator = item.type.toLowerCase();
    const typeInventory = (loadout.items[discriminator] = loadout.items[discriminator] || []);

    const index = typeInventory.findIndex((i) => i.hash === item.hash && i.id === item.id);

    if (index >= 0) {
      const decrement = $event.shiftKey ? 5 : 1;
      item.amount -= decrement;
      if (item.amount <= 0) {
        typeInventory.splice(index, 1);
      }
    }

    if (item.equipped && typeInventory.length > 0) {
      typeInventory[0].equipped = true;
    }

    this.setState({ loadout });
  };

  private setName = (e: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({
      loadout: {
        ...this.state.loadout!,
        name: e.target.value
      }
    });
  };

  private setClassType = (e: React.ChangeEvent<HTMLSelectElement>) => {
    this.setState({
      loadout: {
        ...this.state.loadout!,
        classType: parseInt(e.target.value, 10)
      }
    });
  };

  private saveLoadout = (e) => {
    e.preventDefault();
    const { loadout } = this.state;
    if (!loadout) {
      return;
    }

    dimLoadoutService.saveLoadout(loadout).catch((e) => {
      toaster.pop(
        'error',
        t('Loadouts.SaveErrorTitle'),
        t('Loadouts.SaveErrorDescription', {
          loadoutName: loadout.name,
          error: e.message
        })
      );
      console.error(e);
    });
    this.close(e);
  };

  private saveAsNew = (e) => {
    e.preventDefault();
    const { loadout } = this.state;

    if (!loadout) {
      return;
    }
    loadout.id = uuidv4(); // Let it be a new ID
    this.saveLoadout(e);
  };

  private close = (e?) => {
    e && e.preventDefault();
    this.setState({ show: false });
    dimLoadoutService.dialogOpen = false;
  };

  private fillInDefinitionsForWarnItems = (destinyVersion: 1 | 2, warnitems: DimItem[]) => {
    if (!warnitems || !warnitems.length) {
      return;
    }

    if (destinyVersion === 2) {
      getD2Definitions().then((defs) => {
        for (const warnItem of warnitems) {
          const itemDef = defs.InventoryItem.get(warnItem.hash);
          if (itemDef) {
            warnItem.icon = itemDef.displayProperties.icon;
            warnItem.name = itemDef.displayProperties.name;
          }
        }
        this.setState({ warnitems });
      });
    } else {
      getD1Definitions().then((defs) => {
        for (const warnItem of warnitems) {
          const itemDef = defs.InventoryItem.get(warnItem.hash);
          if (itemDef) {
            warnItem.icon = itemDef.icon;
            warnItem.name = itemDef.itemName;
          }
        }
        this.setState({ warnitems });
      });
    }
  };

  private removeWarnItem = (item: DimItem) => {
    const { warnitems } = this.state;

    this.setState({
      warnitems: warnitems.filter((i) => !(i.hash === item.hash && i.id === item.id))
    });
  };

  private equip = (item: DimItem) => {
    const { loadout } = this.state;
    if (!loadout) {
      return;
    }

    if (item.equipment) {
      if (item.type === 'Class' && !item.equipped) {
        item.equipped = true;
      } else if (item.equipped) {
        item.equipped = false;
      } else {
        const allItems: DimItem[] = _.flatten(Object.values(loadout.items));
        if (item.equippingLabel) {
          const exotics = allItems.filter(
            (i) => i.equippingLabel === item.equippingLabel && i.equipped
          );
          for (const exotic of exotics) {
            exotic.equipped = false;
          }
        }

        allItems.filter((i) => i.type === item.type && i.equipped).forEach((i) => {
          i.equipped = false;
        });

        item.equipped = true;
      }
    }

    this.setState({ loadout });
  };
}

export default connect(mapStateToProps)(LoadoutDrawer);
