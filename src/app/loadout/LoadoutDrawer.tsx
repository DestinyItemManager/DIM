import { t } from 'app/i18next-t';
import React from 'react';
import InventoryItem from '../inventory/InventoryItem';
import _ from 'lodash';
import copy from 'fast-copy';
import { D1ManifestDefinitions } from '../destiny1/d1-definitions';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions';
import { DimItem } from '../inventory/item-types';
import { v4 as uuidv4 } from 'uuid';
import { RootState, ThunkDispatchProp } from '../store/reducers';
import { itemSortOrderSelector } from '../settings/item-sort';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import { destinyVersionSelector, currentAccountSelector } from '../accounts/reducer';
import { storesSelector } from '../inventory/selectors';
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
import { Loadout, LoadoutItem } from './loadout-types';
import { saveLoadout } from './loadout-storage';
import produce from 'immer';
import memoizeOne from 'memoize-one';
import { withRouter, RouteComponentProps } from 'react-router';

// TODO: Consider moving editLoadout/addItemToLoadout/loadoutDialogOpen into Redux (actions + state)

/** Is the loadout drawer currently open? */
export let loadoutDialogOpen = false;

export const editLoadout$ = new Subject<{
  loadout: Loadout;
  showClass?: boolean;
  isNew?: boolean;
}>();
export const addItem$ = new Subject<{
  item: DimItem;
  clickEvent: MouseEvent;
}>();

export function editLoadout(loadout: Loadout, { showClass = true, isNew = true } = {}) {
  editLoadout$.next({
    loadout,
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
  itemSortOrder: string[];
  account: DestinyAccount;
  classTypeOptions: {
    label: string;
    value: number;
  }[];
  stores: DimStore[];
  buckets: InventoryBuckets;
  defs: D1ManifestDefinitions | D2ManifestDefinitions;
}

type Props = StoreProps & ThunkDispatchProp & RouteComponentProps;

interface State {
  loadout?: Readonly<Loadout>;
  show: boolean;
  showClass: boolean;
  isNew: boolean;
  clashingLoadout: Loadout | null;
}

function mapStateToProps() {
  const classTypeOptionsSelector = createSelector(storesSelector, (stores) => {
    const classTypeValues: {
      label: string;
      value: DestinyClass;
    }[] = _.uniqBy(
      stores.filter((s) => !s.isVault),
      (store) => store.classType
    ).map((store) => ({ label: store.className, value: store.classType }));
    return [{ label: t('Loadouts.Any'), value: DestinyClass.Unknown }, ...classTypeValues];
  });

  return (state: RootState): StoreProps => ({
    itemSortOrder: itemSortOrderSelector(state),
    account: currentAccountSelector(state)!,
    classTypeOptions: classTypeOptionsSelector(state),
    stores: storesSelector(state),
    buckets: state.inventory.buckets!,
    defs:
      destinyVersionSelector(state) === 2 ? state.manifest.d2Manifest! : state.manifest.d1Manifest!
  });
}

class LoadoutDrawer extends React.Component<Props, State> {
  state: State = {
    show: false,
    showClass: true,
    isNew: false,
    clashingLoadout: null
  };
  private subscriptions = new Subscriptions();

  componentDidMount() {
    this.subscriptions.add(
      editLoadout$.subscribe(this.editLoadout),
      addItem$.subscribe((args: { item: DimItem; clickEvent: MouseEvent }) => {
        this.add(args.item, args.clickEvent);
      })
    );
  }

  componentDidUpdate(prevProps: Props) {
    if (prevProps.location.pathname !== this.props.location.pathname) {
      this.close();
    }
  }

  componentWillUnmount() {
    this.subscriptions.unsubscribe();
  }

  render() {
    const { buckets, classTypeOptions, stores, itemSortOrder } = this.props;
    const { show, loadout, showClass, isNew, clashingLoadout } = this.state;

    if (!loadout || !show) {
      return null;
    }

    const bucketTypes = Object.keys(buckets.byType);
    const onEdit = () =>
      clashingLoadout &&
      this.setState({ loadout: clashingLoadout, isNew: false, clashingLoadout: null });

    const [items, warnitems] = this.findItems(loadout);

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
                  items={items}
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

  /**
   * Turn the loadout's items into real DIM items. Any that don't exist in inventory anymore
   * are returned as warnitems.
   */
  private findItems = memoizeOne((loadout: Loadout | undefined) => {
    if (!loadout) {
      return [];
    }

    const { stores, defs } = this.props;

    const findItem = (loadoutItem: LoadoutItem) => {
      for (const store of stores) {
        for (const item of store.items) {
          if (loadoutItem.id && loadoutItem.id !== '0' && loadoutItem.id === item.id) {
            return item;
          } else if (
            (!loadoutItem.id || loadoutItem.id === '0') &&
            loadoutItem.hash === item.hash
          ) {
            return item;
          }
        }
      }
      return undefined;
    };

    const items: DimItem[] = [];
    const warnitems: DimItem[] = [];
    for (const loadoutItem of loadout.items) {
      const item = findItem(loadoutItem);
      if (item) {
        items.push(item);
      } else {
        const itemDef = defs.InventoryItem.get(loadoutItem.hash);
        if (itemDef) {
          // TODO: makeFakeItem
          warnitems.push({
            ...loadoutItem,
            icon: itemDef.displayProperties.icon,
            name: itemDef.displayProperties.name
          } as DimItem);
        }
      }
    }

    return [items, warnitems];
  });

  private editLoadout = (args: { loadout: Loadout; showClass?: boolean; isNew?: boolean }) => {
    const { account } = this.props;
    const loadout = copy(args.loadout);
    loadoutDialogOpen = true;
    if (loadout.classType === undefined) {
      loadout.classType = -1;
    }
    loadout.items = loadout.items || {};
    loadout.destinyVersion = account.destinyVersion;
    loadout.membershipId = account.membershipId;

    this.setState({
      show: true,
      loadout,
      showClass: Boolean(args.showClass),
      isNew: Boolean(args.isNew)
    });
  };

  private fixWarnItem = async (warnItem: DimItem) => {
    const { loadout } = this.state;

    const loadoutClassType = loadout?.classType;

    try {
      const { item, equip } = await showItemPicker({
        filterItems: (item: DimItem) =>
          item.hash === warnItem.hash &&
          item.canBeInLoadout() &&
          (!loadout ||
            loadout.classType === DestinyClass.Unknown ||
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
    this.setState((state) => {
      const { loadout } = state;
      if (!loadout) {
        return {};
      }
      if (!item.canBeInLoadout()) {
        showNotification({ type: 'warning', title: t('Loadouts.OnlyItems') });
        return {};
      }
      const [items] = this.findItems(loadout);

      const loadoutItem: LoadoutItem = {
        id: item.id,
        hash: item.hash,
        amount: Math.min(item.amount, e?.shiftKey ? 5 : 1),
        equipped: false
      };

      // Other items of the same type (as DimItem)
      const typeInventory = items.filter((i) => i.type === item.type);

      const dupe = loadout.items.find((i) => i.hash === item.hash && i.id === item.id);

      const maxSlots = item.bucket.capacity;

      const newLoadout = produce(loadout, (draftLoadout) => {
        const findItem = (item: DimItem) =>
          draftLoadout.items.find((i) => i.id === item.id && i.hash === item.hash)!;

        if (!dupe) {
          if (typeInventory.length < maxSlots) {
            loadoutItem.equipped =
              equip === undefined ? item.equipment && typeInventory.length === 0 : equip;
            if (loadoutItem.equipped) {
              for (const otherItem of typeInventory) {
                findItem(otherItem).equipped = false;
              }
            }

            // Only allow one subclass per element
            if (item.type === 'Class') {
              const conflictingItem = items.find(
                (i) => i.type === item.type && i.element?.hash === item.element?.hash
              );
              if (conflictingItem) {
                draftLoadout.items = draftLoadout.items.filter((i) => i.id === conflictingItem.id);
              }
              loadoutItem.equipped = true;
            }

            draftLoadout.items.push(loadoutItem);
          } else {
            showNotification({
              type: 'warning',
              title: t('Loadouts.MaxSlots', { slots: maxSlots })
            });
          }
        } else if (dupe && item.maxStackSize > 1) {
          const increment = Math.min(dupe.amount + item.amount, item.maxStackSize) - dupe.amount;
          dupe.amount = dupe.amount + increment;
          // TODO: handle stack splits
        }

        if (
          draftLoadout.classType === DestinyClass.Unknown &&
          item.classType !== DestinyClass.Unknown
        ) {
          draftLoadout.classType = item.classType;
        }
      });
      return {
        loadout: newLoadout
      };
    });
  };

  private remove = (item: DimItem, $event) => {
    $event.stopPropagation();
    const { loadout } = this.state;

    if (!loadout) {
      return;
    }

    const newLoadout = produce(loadout, (draftLoadout) => {
      const loadoutItem = draftLoadout.items.find((i) => i.hash === item.hash && i.id === item.id);

      if (!loadoutItem) {
        return;
      }

      const decrement = $event.shiftKey ? 5 : 1;
      loadoutItem.amount = (loadoutItem.amount || 1) - decrement;
      if (loadoutItem.amount <= 0) {
        draftLoadout.items = draftLoadout.items.filter(
          (i) => !(i.hash === item.hash && i.id === item.id)
        );
      }

      if (loadoutItem.equipped) {
        const [items] = this.findItems(draftLoadout);
        const typeInventory = items.filter((i) => i.type === item.type);
        const nextInLine =
          typeInventory.length > 0 &&
          draftLoadout.items.find(
            (i) => i.id === typeInventory[0].id && i.hash === typeInventory[0].hash
          );
        if (nextInLine) {
          nextInLine.equipped = true;
        }
      }
    });

    if (newLoadout !== loadout) {
      this.setState({ loadout: newLoadout });
    }
  };

  private saveLoadout = async (e, loadout = this.state.loadout) => {
    e.preventDefault();
    const { dispatch } = this.props;
    if (!loadout) {
      return;
    }

    this.close();
    try {
      const clashingLoadout = await dispatch(saveLoadout(loadout));
      this.handleLoadOutSaveResult(clashingLoadout);
    } catch (e) {
      this.handleLoadoutError(e, loadout.name);
    }
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
      this.setState({
        loadout: {
          ...loadout,
          name: ''
        },
        clashingLoadout: null
      });
    }
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
    const newLoadout = {
      ...copy(loadout),
      id: uuidv4() // Let it be a new ID
    };
    this.setState({ loadout: newLoadout, isNew: true });
    this.saveLoadout(e, newLoadout);
  };

  private close = (e?) => {
    e?.preventDefault();
    this.setState({ show: false, loadout: undefined, clashingLoadout: null });
    this.findItems(undefined); // clear memoize
    loadoutDialogOpen = false;
  };

  private removeWarnItem = (item: DimItem) => {
    this.setState((state) => ({
      loadout: {
        ...state.loadout!,
        items: state.loadout!.items.filter((i) => !(i.hash === item.hash && i.id === item.id))
      }
    }));
  };

  private equip = (item: DimItem) => {
    const { loadout } = this.state;
    if (!loadout) {
      return;
    }

    const [items] = this.findItems(loadout);

    const newLoadout = produce(loadout, (draftLoadout) => {
      const findItem = (item: DimItem) =>
        draftLoadout.items.find((i) => i.id === item.id && i.hash === item.hash)!;
      const loadoutItem = findItem(item);
      if (item.equipment) {
        if (item.type === 'Class' && !loadoutItem.equipped) {
          loadoutItem.equipped = true;
        } else if (loadoutItem.equipped) {
          loadoutItem.equipped = false;
        } else {
          items
            .filter(
              (i) =>
                // Others in this slot
                i.type === item.type ||
                // Other exotics
                (item.equippingLabel && i.equippingLabel === item.equippingLabel)
            )
            .map(findItem)
            .forEach((i) => {
              i.equipped = false;
            });

          loadoutItem.equipped = true;
        }
      }
    });

    this.setState({ loadout: newLoadout });
  };
}

export default withRouter(connect(mapStateToProps)(LoadoutDrawer));
