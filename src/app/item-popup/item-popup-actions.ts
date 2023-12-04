import { DimItem } from 'app/inventory/item-types';
import { DimStore } from 'app/inventory/store-types';
import { amountOfItem, getCurrentStore, getStore } from 'app/inventory/stores-helpers';
import { pullFromPostmasterAmount } from 'app/loadout-drawer/postmaster';
import { itemCanBeEquippedBy, itemCanBeInLoadout } from 'app/utils/item-utils';
import { BucketHashes } from 'data/d2/generated-enums';

/** Information about a store or equip button - which store it belongs to and whether it's enabled. */
export interface StoreButtonInfo {
  store: DimStore;
  enabled: boolean;
}

/**
 * A precomputed model that explains what actions can exist for a given item.
 */
export interface ItemActionsModel {
  /** Show the "consolidate" action which pulls separate stacks of stackable consumables together. */
  canConsolidate: boolean;
  /** Show the "distribute" action which splits stacks evenly across characters (D1 only) */
  canDistribute: boolean;
  /** Show the tagging dropdown and notes input. */
  taggable: boolean;
  /** Show a button to lock (or track) the item. */
  lockable: boolean;
  /** Show the Compare option for comparing similar items. */
  comparable: boolean;
  /** Show the Infuse button for finding infusion materials. */
  infusable: boolean;
  /** Show the Add to Loadout button. */
  loadoutable: boolean;
  /** This item is in the Postmaster, so it shouldn't get the standard move controls. This doesn't necessarily mean it can be pulled though. */
  inPostmaster: boolean;
  /** This item can be pulled from the Postmaster, and thus should get custom pull-from-Postmaster controls. */
  pullFromPostmaster: boolean;
  /** This item can be transferred to the vault, so show a vault button. */
  canVault: boolean;
  /** The maximum amount of this item that could be moved. */
  maximumMoveAmount: number;
  /** Show an editor for the amount of items to move. */
  showAmounts: boolean;
  /** A list of stores that we could equip to. This includes all valid locations, but some can be disabled. */
  equip: StoreButtonInfo[];
  /** A list of stores that we could move to. This includes all valid locations, but some can be disabled. Vault isn't included. */
  store: StoreButtonInfo[];
  /** Should this item have any buttons for moving the item around? If not, we don't need to show the move buttons area. */
  hasMoveControls: boolean;
  /** Should this item have any buttons for "accessory actions" like tagging, locking, etc? If not, we don't need to show that area. */
  hasAccessoryControls: boolean;
  /** Given all the above, are there any controls at all to show? If not, we don't need to show the buttons area / sidecar at all. */
  hasControls: boolean;
}

export function buildItemActionsModel(item: DimItem, stores: DimStore[]): ItemActionsModel {
  const itemOwner = getStore(stores, item.owner);
  const canConsolidate =
    !item.notransfer &&
    item.location.hasTransferDestination &&
    item.maxStackSize > 1 &&
    stores.some((s) => s !== itemOwner && amountOfItem(s, item) > 0);
  const canDistribute = item.destinyVersion === 1 && !item.notransfer && item.maxStackSize > 1;

  const taggable = item.taggable;
  const lockable = item.lockable || item.trackable;
  const comparable = item.comparable;
  const infusable = !(!item.infusionFuel || !itemOwner);
  const loadoutable = !(!itemCanBeInLoadout(item) || !itemOwner);

  const inPostmaster = item.location.hash === BucketHashes.LostItems;
  // The Account-wide bucket (consumables) exists only for the active character, so check that bucket.
  // Otherwise, check the owner's bucket.
  const postmasterCheckStore = inPostmaster
    ? item.bucket.accountWide
      ? getCurrentStore(stores)
      : itemOwner
    : undefined;
  const pullAmount = postmasterCheckStore
    ? pullFromPostmasterAmount(item, postmasterCheckStore, stores)
    : 0;
  const pullFromPostmaster = pullAmount > 0;

  const canVault = Boolean(itemOwner && canTransferToVault(itemOwner, item));

  const maximumMoveAmount = inPostmaster
    ? pullAmount
    : !itemOwner || item.maxStackSize <= 1 || item.notransfer || item.uniqueStack
      ? 1
      : amountOfItem(itemOwner, item);
  const showAmounts = !inPostmaster && maximumMoveAmount > 1;
  const canEquip = itemOwner ? stores.filter((store) => itemCanBeEquippedBy(item, store)) : [];
  const canStore = itemOwner ? stores.filter((store) => canShowStore(store, itemOwner, item)) : [];
  const disableEquip = (store: DimStore) => item.owner === store.id && item.equipped;
  const disableStore = (store: DimStore) =>
    !itemOwner || !storeButtonEnabled(store, itemOwner, item);

  const equip = canEquip.map((s) => ({ store: s, enabled: !disableEquip(s) }));
  const store = canStore.map((s) => ({ store: s, enabled: !disableStore(s) }));

  const hasMoveControls = Boolean(
    (inPostmaster && pullFromPostmaster) || equip.length || store.length,
  );
  const hasAccessoryControls = Boolean(
    taggable ||
      lockable ||
      comparable ||
      infusable ||
      loadoutable ||
      canConsolidate ||
      canDistribute,
  );
  const hasControls = hasAccessoryControls || hasMoveControls;

  return {
    canConsolidate,
    canDistribute,
    taggable,
    lockable,
    comparable,
    infusable,
    loadoutable,
    inPostmaster,
    pullFromPostmaster,
    canVault,
    maximumMoveAmount,
    showAmounts,
    equip,
    store,
    hasMoveControls,
    hasAccessoryControls,
    hasControls,
  };
}

function canTransferToVault(itemOwnerStore: DimStore, item: DimItem): boolean {
  return (
    // The item must actually be in a store (not a vendor item)
    itemOwnerStore &&
    // Not already in the vault
    !itemOwnerStore.isVault &&
    // Is transferrable away from the current itemStore
    !item.notransfer &&
    // moot point because it can't be claimed from the postmaster
    !(item.location.inPostmaster && !item.canPullFromPostmaster)
  );
}

function storeButtonEnabled(
  buttonStore: DimStore,
  itemOwnerStore: DimStore,
  item: DimItem,
): boolean {
  const store = itemOwnerStore;

  if (item.location.inPostmaster && item.location.hash !== BucketHashes.Engrams) {
    return item.canPullFromPostmaster;
  } else if (item.notransfer) {
    // Can store an equipped item in same itemStore
    if (item.equipped && store.id === buttonStore.id) {
      return true;
    }
  } else if (store.id !== buttonStore.id || item.equipped) {
    // Only show one store for account wide items
    return !item.bucket?.accountWide || buttonStore.current;
  }

  return false;
}

function canShowStore(buttonStore: DimStore, itemOwnerStore: DimStore, item: DimItem): boolean {
  const store = itemOwnerStore;

  // Can't store into a vault
  if (buttonStore.isVault || !store) {
    return false;
  }

  // Don't show "Store" for finishers, seasonal artifacts, or clan banners
  if (
    item.location.capacity === 1 ||
    item.location.hash === BucketHashes.SeasonalArtifact ||
    item.location.hash === BucketHashes.Finishers
  ) {
    return false;
  }

  // Can pull items from the postmaster.
  if (item.location.inPostmaster && item.location.hash !== BucketHashes.Engrams) {
    return item.canPullFromPostmaster;
  } else if (item.notransfer) {
    // Can store an equipped item in same itemStore
    if (item.equipped && store.id === buttonStore.id) {
      return true;
    }
  } else {
    // Only show one store for account wide items
    return !item.bucket?.accountWide || buttonStore.current;
  }

  return false;
}
