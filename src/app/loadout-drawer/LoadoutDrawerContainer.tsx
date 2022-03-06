import { DestinyAccount } from 'app/accounts/destiny-account';
import LoadoutDrawer from 'app/destiny1/loadout-drawer/LoadoutDrawer';
import { t } from 'app/i18next-t';
import { DimItem } from 'app/inventory/item-types';
import { storesSelector } from 'app/inventory/selectors';
import { DimStore } from 'app/inventory/store-types';
import { getCurrentStore, getStore } from 'app/inventory/stores-helpers';
import { warnMissingClass } from 'app/loadout-builder/loadout-builder-reducer';
import { useD2Definitions } from 'app/manifest/selectors';
import { showNotification } from 'app/notifications/notifications';
import { useEventBusListener } from 'app/utils/hooks';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import React, { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router';
import { v4 as uuidv4 } from 'uuid';
import { addItem$, editLoadout$ } from './loadout-events';
import { convertDimApiLoadoutToLoadout } from './loadout-type-converters';
import { Loadout } from './loadout-types';
import { newLoadout } from './loadout-utils';
import LoadoutDrawer2 from './LoadoutDrawer2';

/**
 * A launcher for the LoadoutDrawer. This is used both so we can lazy-load the
 * LoadoutDrawer, and so we can make sure defs are defined when the loadout
 * drawer is rendered.
 */
export default function LoadoutDrawerContainer({ account }: { account: DestinyAccount }) {
  const defs = useD2Definitions();
  const navigate = useNavigate();
  const { search: queryString, pathname } = useLocation();

  // This state only holds the initial version of the loadout that launches the
  // drawer - after that, the loadout drawer itself manages edits to the
  // loadout.
  // TODO: Alternately we could come up with the concept of a
  // `useControlledReducer` that applied a reducer to mutate an object whose
  // state is handled outside the component.
  const [initialLoadout, setInitialLoadout] =
    useState<{ loadout: Loadout; storeId?: string; showClass: boolean; isNew: boolean }>();

  const handleDrawerClose = () => setInitialLoadout(undefined);

  // The loadout to edit comes in from the editLoadout$ observable
  useEventBusListener(
    editLoadout$,
    useCallback(({ loadout, storeId, showClass, isNew }) => {
      setInitialLoadout({
        loadout,
        storeId: storeId === 'vault' ? undefined : storeId,
        showClass: Boolean(showClass),
        isNew: Boolean(isNew),
      });
    }, [])
  );

  const stores = useSelector(storesSelector);

  const hasInitialLoadout = Boolean(initialLoadout);

  // Only react to add item if there's not a loadout open (otherwise it'll be handled in the loadout drawer!)
  useEventBusListener(
    addItem$,
    useCallback(
      (item: DimItem) => {
        if (!hasInitialLoadout) {
          // If we don't have a loadout, this action was invoked via the "+ Loadout" button in item actions
          let owner: DimStore =
            item.owner === 'vault' ? getCurrentStore(stores)! : getStore(stores, item.owner)!;

          if (item.classType !== DestinyClass.Unknown && item.classType !== owner.classType) {
            const matchingStore = stores.find((s) => s.classType === item.classType);
            if (!matchingStore) {
              showNotification({
                type: 'warning',
                title: t('Loadouts.ClassTypeMissing', { className: item.classTypeNameLocalized }),
              });
              return;
            }
            owner = matchingStore;
          }

          const classType =
            item.classType === DestinyClass.Unknown ? owner.classType : item.classType;
          const draftLoadout = newLoadout('', [], classType);
          draftLoadout.items.push({
            id: item.id,
            hash: item.hash,
            equip: true,
            amount: item.amount ?? 1,
          });
          setInitialLoadout({
            loadout: draftLoadout,
            storeId: owner.id,
            isNew: true,
            showClass: true,
          });
        }
      },
      [hasInitialLoadout, stores]
    )
  );

  // Load in a full loadout specified in the URL
  useEffect(() => {
    if (!stores.length || !defs?.isDestiny2()) {
      return;
    }
    const searchParams = new URLSearchParams(queryString);
    const loadoutJSON = searchParams.get('loadout');
    if (loadoutJSON) {
      try {
        const parsedLoadout = convertDimApiLoadoutToLoadout(JSON.parse(loadoutJSON));
        if (parsedLoadout) {
          const storeId =
            parsedLoadout.classType === DestinyClass.Unknown
              ? getCurrentStore(stores)?.id
              : stores.find((s) => s.classType === parsedLoadout.classType)?.id;

          if (!storeId) {
            warnMissingClass(parsedLoadout.classType, defs);
            return;
          }

          parsedLoadout.id = uuidv4();
          parsedLoadout.items = parsedLoadout.items.map((item) => ({
            ...item,
            id:
              item.id === '0'
                ? // We don't save consumables in D2 loadouts, but we may omit ids in shared loadouts
                  // (because they'll never match someone else's inventory). So
                  // instead, pick a random ID. It's possible these will
                  // conflict with something already in the user's inventory but
                  // it's not likely.
                  Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString()
                : item.id,
          }));

          setInitialLoadout({
            loadout: parsedLoadout,
            storeId,
            isNew: true,
            showClass: false,
          });
        }
      } catch (e) {
        showNotification({
          type: 'error',
          title: t('Loadouts.BadLoadoutShare'),
          body: t('Loadouts.BadLoadoutShareBody', { error: e.message }),
        });
      }
      // Clear the loadout
      navigate(pathname, { replace: true });
    }
  }, [defs, queryString, navigate, pathname, stores]);

  if (initialLoadout) {
    return account.destinyVersion === 2 ? (
      <LoadoutDrawer2
        initialLoadout={initialLoadout.loadout}
        storeId={initialLoadout.storeId}
        isNew={initialLoadout.isNew}
        onClose={handleDrawerClose}
      />
    ) : (
      <LoadoutDrawer
        initialLoadout={initialLoadout.loadout}
        storeId={initialLoadout.storeId}
        isNew={initialLoadout.isNew}
        showClass={initialLoadout.showClass}
        onClose={handleDrawerClose}
      />
    );
  }
  return null;
}
