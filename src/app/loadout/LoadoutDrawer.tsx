import { t } from 'app/i18next-t';
import React from 'react';
import InventoryItem from '../inventory/InventoryItem';
import _ from 'lodash';
import copy from 'fast-copy';
import { getDefinitions as getD1Definitions } from '../destiny1/d1-definitions';
import { getDefinitions as getD2Definitions } from '../destiny2/d2-definitions';
import { DimItem } from '../inventory/item-types';
import uuidv4 from 'uuid/v4';
import { D2Categories } from '../destiny2/d2-buckets';
import { D1Categories } from '../destiny1/d1-buckets';
import { router } from '../router';
import { RootState } from '../store/reducers';
import { itemSortOrderSelector } from '../settings/item-sort';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import { destinyVersionSelector, currentAccountSelector } from '../accounts/reducer';
import { storesSelector } from '../inventory/reducer';
import LoadoutDrawerDropTarget from './LoadoutDrawerDropTarget';
import LoadoutEditPopup from './LoadoutEditPopup';
import { InventoryBuckets } from '../inventory/inventory-buckets';
import './loadout-drawer.scss';
import { Subscriptions } from '../utils/rx-utils';
import { DestinyAccount } from '../accounts/destiny-account';
import Sheet from '../dim-ui/Sheet';
import { showNotification } from '../notifications/notifications';
import { showItemPicker } from '../item-picker/item-picker';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import { DimStore } from '../inventory/store-types';
import LoadoutDrawerContents from './LoadoutDrawerContents';
import LoadoutDrawerOptions from './LoadoutDrawerOptions';
import { Subject } from 'rxjs';
import {
  Loadout,
  loadoutClassToClassType,
  LoadoutClass,
  classTypeToLoadoutClass
} from './loadout-types';
import { saveLoadout } from './loadout-storage';

// TODO: Consider moving editLoadout/addItemToLoadout/loadoutDialogOpen into Redux (actions + state)

/** Is the loadout drawer currently open? */
export let loadoutDialogOpen = false;

export const editLoadout$ = new Subject<{
  loadout: Loadout;
  equipAll?: boolean;
  showClass?: boolean;
  isNew?: boolean;
}>();
export const addItem$ = new Subject<{
  item: DimItem;
  clickEvent: MouseEvent;
}>();

export function editLoadout(
  loadout: Loadout,
  { equipAll = false, showClass = true, isNew = true } = {}
) {
  editLoadout$.next({
    loadout,
    equipAll,
    showClass,
    isNew
  });
}

export function addItemToLoadout(item: DimItem, $event) {
  addItem$.next({
    item,
    clickEvent: $event
  });
}

interface StoreProps {
  types: string[];
  itemSortOrder: string[];
  account: DestinyAccount;
  classTypeOptions: {
    label: string;
    value: number;
  }[];
  stores: DimStore[];
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

function mapStateToProps() {
  const typesSelector = createSelector(destinyVersionSelector, (destinyVersion) => {
    const dimItemCategories = destinyVersion === 2 ? D2Categories : D1Categories;
    return Object.values(dimItemCategories)
      .flat()
      .map((t) => t.toLowerCase());
  });

  const classTypeOptionsSelector = createSelector(storesSelector, (stores) => {
    const classTypeValues: {
      label: string;
      value: LoadoutClass;
    }[] = [{ label: t('Loadouts.Any'), value: LoadoutClass.any }];
    _.uniqBy(
      stores.filter((s) => !s.isVault),
      (store) => store.classType
    ).forEach((store) => {
      let classType = 0;

      /*
      Bug here was localization tried to change the label order, but users have saved their loadouts with data that was in the original order.
      These changes broke loadouts.  Next time, you have to map values between new and old values to preserve backwards compatability.
      */
      switch (parseInt(store.classType.toString(), 10)) {
        case DestinyClass.Titan: {
          classType = LoadoutClass.titan;
          break;
        }
        case DestinyClass.Hunter: {
          classType = LoadoutClass.hunter;
          break;
        }
        case DestinyClass.Warlock: {
          classType = LoadoutClass.warlock;
          break;
        }
      }

      classTypeValues.push({ label: store.className, value: classType });
    });
    return classTypeValues;
  });

  return (state: RootState): StoreProps => ({
    itemSortOrder: itemSortOrderSelector(state),
    types: typesSelector(state),
    account: currentAccountSelector(state)!,
    classTypeOptions: classTypeOptionsSelector(state),
    stores: storesSelector(state),
    buckets: state.inventory.buckets!
  });
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
      editLoadout$.subscribe(this.editLoadout),
      addItem$.subscribe((args: { item: DimItem; clickEvent: MouseEvent }) => {
        this.add(args.item, args.clickEvent);
      })
    );
  }

  componentWillUnmount() {
    this.listener();
    this.subscriptions.unsubscribe();
  }

  render() {
    const { buckets, classTypeOptions, stores, itemSortOrder } = this.props;
    const { show, loadout, warnitems, showClass, isNew, clashingLoadout } = this.state;

    if (!loadout || !show) {
      return null;
    }

    const bucketTypes = Object.keys(buckets.byType);
    const onEdit = () =>
      clashingLoadout &&
      this.setState({ loadout: clashingLoadout, isNew: false, clashingLoadout: null });

    const header = (
      <div className="loadout-drawer-header">
        <h1>{isNew ? t('Loadouts.Create') : t('Loadouts.Edit')}</h1>
        {clashingLoadout && (
          <LoadoutEditPopup
            changeNameHandler={() => this.changeNameHandler()}
            editHandler={onEdit}
            loadoutClass={clashingLoadout.classType}
            loadoutName={clashingLoadout.name}
          />
        )}
        <LoadoutDrawerOptions
          loadout={loadout}
          showClass={showClass}
          isNew={isNew}
          classTypeOptions={classTypeOptions}
          updateLoadout={(loadout) => this.setState({ loadout })}
          saveLoadout={this.saveLoadout}
          saveAsNew={this.saveAsNew}
        />
      </div>
    );

    return (
      <Sheet onClose={this.close} header={header}>
        <div id="loadout-drawer" className="loadout-create">
          <div className="loadout-content">
            <LoadoutDrawerDropTarget
              bucketTypes={bucketTypes}
              storeIds={stores.map((s) => s.id)}
              onDroppedItem={this.add}
            >
              {warnitems.length > 0 && (
                <div className="loadout-contents">
                  <p>{t('Loadouts.VendorsCannotEquip')}</p>
                  <div className="loadout-warn-items">
                    {warnitems.map((item) => (
                      <div key={item.id} className="loadout-item">
                        <InventoryItem item={item} onClick={() => this.fixWarnItem(item)} />
                        <div className="close" onClick={() => this.removeWarnItem(item)} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="loadout-contents">
                <LoadoutDrawerContents
                  loadout={loadout}
                  buckets={buckets}
                  stores={stores}
                  itemSortOrder={itemSortOrder}
                  equip={this.equip}
                  remove={this.remove}
                  add={this.add}
                />
              </div>
            </LoadoutDrawerDropTarget>
          </div>
        </div>
      </Sheet>
    );
  }

  private editLoadout = (args: {
    loadout: Loadout;
    equipAll?: boolean;
    showClass?: boolean;
    isNew?: boolean;
  }) => {
    const { account } = this.props;
    const loadout = copy(args.loadout);
    loadoutDialogOpen = true;
    if (loadout.classType === undefined) {
      loadout.classType = -1;
    }
    loadout.items = loadout.items || {};
    loadout.destinyVersion = account.destinyVersion;
    loadout.platform = account.platformLabel;
    loadout.membershipId = account.membershipId;

    // Filter out any vendor items and equip all if requested
    const warnitems = Object.values(loadout.items).flatMap((items) =>
      items.filter((item) => !item.owner)
    );
    this.fillInDefinitionsForWarnItems(this.props.account.destinyVersion, warnitems);

    _.forIn(loadout.items, (items, type) => {
      loadout.items[type] = items.filter((item) => item.owner);
      if (args.equipAll && loadout.items[type][0]) {
        loadout.items[type][0].equipped = true;
      }
    });

    this.setState({
      show: true,
      loadout,
      warnitems,
      showClass: Boolean(args.showClass),
      isNew: Boolean(args.isNew)
    });
  };

  private fixWarnItem = async (warnItem: DimItem) => {
    const { loadout } = this.state;

    const loadoutClassType = loadout && loadoutClassToClassType[loadout.classType];

    try {
      const { item, equip } = await showItemPicker({
        filterItems: (item: DimItem) =>
          item.hash === warnItem.hash &&
          item.canBeInLoadout() &&
          (!loadout ||
            loadout.classType === LoadoutClass.any ||
            item.classType === loadoutClassType ||
            item.classType === DestinyClass.Unknown),
        prompt: t('Loadouts.FindAnother', { name: warnItem.name }),
        equip: warnItem.equipped,

        // don't show information related to selected perks so we don't give the impression
        // that we will update perk selections when applying the loadout
        ignoreSelectedPerks: true
      });

      this.add(item, undefined, equip);
      this.removeWarnItem(warnItem);
    } catch (e) {}
  };

  private add = (item: DimItem, e?: MouseEvent, equip?: boolean) => {
    const { loadout } = this.state;
    if (!loadout) {
      return;
    }
    if (item.canBeInLoadout()) {
      const clone = copy(item);

      const discriminator = clone.type.toLowerCase();
      const typeInventory = (loadout.items[discriminator] = loadout.items[discriminator] || []);

      clone.amount = Math.min(clone.amount, e?.shiftKey ? 5 : 1);

      const dupe = typeInventory.find((i) => i.hash === clone.hash && i.id === clone.id);

      let maxSlots = 10;
      if (item.type === 'Material') {
        maxSlots = 20;
      } else if (item.type === 'Consumable') {
        maxSlots = 19;
      }

      if (!dupe) {
        if (typeInventory.length < maxSlots) {
          clone.equipped =
            equip === undefined ? item.equipment && typeInventory.length === 0 : equip;

          // Only allow one subclass per burn
          if (clone.type === 'Class') {
            const other = loadout.items.class;
            if (other?.length && other[0].element?.hash !== clone.element?.hash) {
              loadout.items.class.splice(0, loadout.items.class.length);
            }
            clone.equipped = true;
          }

          typeInventory.push(clone);
        } else {
          showNotification({ type: 'warning', title: t('Loadouts.MaxSlots', { slots: maxSlots }) });
        }
      } else if (dupe && clone.maxStackSize > 1) {
        const increment = Math.min(dupe.amount + clone.amount, dupe.maxStackSize) - dupe.amount;
        dupe.amount += increment;
        // TODO: handle stack splits
      }

      if (loadout.classType === LoadoutClass.any && item.classType !== DestinyClass.Unknown) {
        loadout.classType = classTypeToLoadoutClass[item.classType];
      }
      this.setState({ loadout });
    } else {
      showNotification({ type: 'warning', title: t('Loadouts.OnlyItems') });
    }
  };

  private remove = (item: DimItem, $event) => {
    $event.stopPropagation();
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

  private saveLoadout = (e) => {
    e.preventDefault();
    const { loadout } = this.state;
    if (!loadout) {
      return;
    }

    this.close();
    saveLoadout(loadout)
      .then(this.handleLoadOutSaveResult)
      .catch((e) => this.handleLoadoutError(e, loadout.name));
  };

  private handleLoadOutSaveResult = (clashingLoadout?: Loadout) => {
    if (clashingLoadout) {
      showNotification({
        type: 'error',
        title: t('Loadouts.ClashingTitle'),
        body: t('Loadouts.ClashingDescription', {
          loadoutName: clashingLoadout.name
        }),
        onClick: () => {
          this.setState({ show: true, clashingLoadout: copy(clashingLoadout) });
          loadoutDialogOpen = true;
        }
      });
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
    showNotification({
      type: 'error',
      title: t('Loadouts.SaveErrorTitle'),
      body: t('Loadouts.SaveErrorDescription', {
        loadoutName: name,
        error: e.message
      })
    });
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
    e?.preventDefault();
    this.setState({ show: false, clashingLoadout: null });
    loadoutDialogOpen = false;
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
        const allItems: DimItem[] = Object.values(loadout.items).flat();
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
