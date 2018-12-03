import { t } from 'i18next';
import * as React from 'react';
import InventoryItem from '../inventory/InventoryItem';
import { toaster } from '../ngimport-more';
import { dimLoadoutService, Loadout, LoadoutItem } from './loadout.service';
import * as _ from 'lodash';
import { sortItems } from '../shell/dimAngularFilters.filter';
import copy from 'fast-copy';
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
import { destinyVersionSelector, currentAccountSelector } from '../accounts/reducer';
import { storesSelector } from '../inventory/reducer';
import spartan from '../../images/spartan.png';
import LoadoutDrawerDropTarget from './LoadoutDrawerDropTarget';
import LoadoutEditPopup from './LoadoutEditPopup';
import { InventoryBuckets } from '../inventory/inventory-buckets';
import './loadout-drawer.scss';
import { Subscriptions } from '../rx-utils';
import { DestinyAccount } from '../accounts/destiny-account.service';
import Sheet from '../dim-ui/Sheet';

interface StoreProps {
  types: string[];
  itemSortOrder: string[];
  account: DestinyAccount;
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
  showClass: boolean;
  isNew: boolean;
  clashingLoadout: Loadout | null;
}

const typesSelector = createSelector(
  destinyVersionSelector,
  (destinyVersion) => {
    const dimItemCategories = destinyVersion === 2 ? D2Categories : D1Categories;
    return _.flatten(Object.values(dimItemCategories)).map((t) => t.toLowerCase());
  }
);

const classTypeOptionsSelector = createSelector(
  storesSelector,
  (stores) => {
    const classTypeValues: {
      label: string;
      value: number;
    }[] = [{ label: t('Loadouts.Any'), value: -1 }];
    _.each(_.uniqBy(stores.filter((s) => !s.isVault), (store) => store.classType), (store) => {
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
  }
);

const storeIdsSelector = createSelector(
  storesSelector,
  (stores) => stores.map((s) => s.id)
);

function mapStateToProps(state: RootState): StoreProps {
  return {
    itemSortOrder: itemSortOrderSelector(state),
    types: typesSelector(state),
    account: currentAccountSelector(state)!,
    classTypeOptions: classTypeOptionsSelector(state),
    storeIds: storeIdsSelector(state),
    buckets: state.inventory.buckets!
  };
}

class LoadoutDrawer extends React.Component<Props, State> {
  state: State = {
    warnitems: [],
    show: false,
    showClass: true,
    isNew: false,
    clashingLoadout: null
  };
  private subscriptions = new Subscriptions();
  // tslint:disable-next-line:ban-types
  private listener: Function;

  componentDidMount() {
    this.listener = router.transitionService.onExit({}, () => {
      this.close();
    });

    this.subscriptions.add(
      dimLoadoutService.editLoadout$.subscribe(
        (args: { loadout: Loadout; equipAll?: boolean; showClass?: boolean; isNew?: boolean }) => {
          const { account } = this.props;
          const loadout = copy(args.loadout);
          dimLoadoutService.dialogOpen = true;
          if (loadout.classType === undefined) {
            loadout.classType = -1;
          }
          loadout.items = loadout.items || {};
          loadout.destinyVersion = account.destinyVersion;
          loadout.platform = account.platformLabel;

          // Filter out any vendor items and equip all if requested
          const warnitems = _.flatMap(Object.values(loadout.items), (items) =>
            items.filter((item) => !item.owner)
          );
          this.fillInDefinitionsForWarnItems(this.props.account.destinyVersion, warnitems);

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
            warnitems,
            showClass: Boolean(args.showClass),
            isNew: Boolean(args.isNew)
          });
        }
      ),
      dimLoadoutService.addItem$.subscribe((args: { item: DimItem; clickEvent: MouseEvent }) => {
        this.add(args.item, args.clickEvent);
      })
    );
  }

  componentWillUnmount() {
    this.listener();
    this.subscriptions.unsubscribe();
  }

  render() {
    const { buckets, classTypeOptions, storeIds } = this.props;
    const { show, loadout, warnitems, showClass, isNew, clashingLoadout } = this.state;

    if (!loadout || !show) {
      return null;
    }

    const bucketTypes = Object.keys(buckets.byType);
    const onEdit = () =>
      clashingLoadout &&
      this.setState({ loadout: clashingLoadout, isNew: false, clashingLoadout: null });

    return (
      <Sheet onClose={this.close}>
        <div id="loadout-drawer" className="loadout-create">
          <div className="loadout-content">
            {clashingLoadout && (
              <LoadoutEditPopup
                changeNameHandler={() => this.changeNameHandler()}
                editHandler={onEdit}
                loadoutClass={clashingLoadout.classType}
                loadoutName={clashingLoadout.name}
              />
            )}
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
                  value={loadout.name}
                  placeholder={t('Loadouts.LoadoutName')}
                />{' '}
                {showClass && (
                  <select
                    className="dim-select"
                    name="classType"
                    onChange={this.setClassType}
                    value={loadout.classType}
                  >
                    {classTypeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
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
              <div className="loadout-contents">{this.renderLoadoutContents(loadout)}</div>
            </LoadoutDrawerDropTarget>
          </div>
        </div>
      </Sheet>
    );
  }

  private renderLoadoutContents = (loadout: Loadout) => {
    const { types } = this.props;

    return types.map((value) => this.renderLoadoutItems(value, loadout), this);
  };

  private renderLoadoutItems = (value: string, loadout: Loadout) => {
    const { itemSortOrder } = this.props;
    const loadoutItems = loadout.items[value];

    if (!loadoutItems || loadoutItems.length === 0) {
      return null;
    }

    const sortedItems = sortItems(loadoutItems, itemSortOrder);
    const inventoryItems = sortedItems.map(this.renderInventoryItem, this);

    return (
      <div key={value} className={`loadout-${value} loadout-bucket`}>
        {inventoryItems}
      </div>
    );
  };

  private renderInventoryItem = (item: LoadoutItem) => (
    <div key={item.id} onClick={() => this.equip(item)} className="loadout-item">
      <InventoryItem item={item} />
      <div className="close" onClick={(e) => this.remove(item, e)} />
      {item.equipped && <div className="equipped" ng-show="item.equipped" />}
    </div>
  );

  private add = (item: DimItem, e?: MouseEvent) => {
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

    dimLoadoutService
      .saveLoadout(loadout)
      .then(this.handleLoadOutSaveResult)
      .catch((e) => this.handleLoadoutError(e, loadout.name));
  };

  private handleLoadOutSaveResult = (clashingLoadout: Loadout | undefined) => {
    if (clashingLoadout) {
      this.setState({ clashingLoadout: copy(clashingLoadout) });
    } else {
      this.close();
    }
  };

  private changeNameHandler() {
    const { loadout } = this.state;
    if (loadout) {
      loadout.name = '';
    }

    this.setState({ loadout, clashingLoadout: null });
  }

  private handleLoadoutError = (e, name: string) => {
    toaster.pop(
      'error',
      t('Loadouts.SaveErrorTitle'),
      t('Loadouts.SaveErrorDescription', {
        loadoutName: name,
        error: e.message
      })
    );
    console.error(e);
    this.close(e);
  };

  private saveAsNew = (e) => {
    e.preventDefault();
    const { loadout } = this.state;

    if (!loadout) {
      return;
    }
    loadout.id = uuidv4(); // Let it be a new ID
    this.setState({ isNew: true });
    this.saveLoadout(e);
  };

  private close = (e?) => {
    e && e.preventDefault();
    this.setState({ show: false, clashingLoadout: null });
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

        allItems
          .filter((i) => i.type === item.type && i.equipped)
          .forEach((i) => {
            i.equipped = false;
          });

        item.equipped = true;
      }
    }

    this.setState({ loadout });
  };
}

export default connect(mapStateToProps)(LoadoutDrawer);
