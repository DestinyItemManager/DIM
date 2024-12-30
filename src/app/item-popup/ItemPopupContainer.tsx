import { createItemContextSelector, sortedStoresSelector } from 'app/inventory/selectors';
import { DimStore } from 'app/inventory/store-types';
import { applySocketOverrides } from 'app/inventory/store/override-sockets';
import { useD2Definitions } from 'app/manifest/selectors';
import { lazy, Suspense, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router';
import { useSubscription } from 'use-subscription';
import { DimItem } from '../inventory/item-types';
import { hideItemPopup, showItemPopup$ } from './item-popup';

const ItemPopup = lazy(() => import(/* webpackChunkName: "item-popup-armory" */ './ItemPopup'));

interface Props {
  boundarySelector?: string;
}

/**
 * A container that can show a single item popup/tooltip. This is a
 * single element to help prevent multiple popups from showing at once.
 */
export default function ItemPopupContainer({ boundarySelector }: Props) {
  const stores = useSelector(sortedStoresSelector);
  const defs = useD2Definitions();
  const itemCreationContext = useSelector(createItemContextSelector);

  const currentItem = useSubscription(showItemPopup$);

  const onClose = () => hideItemPopup();

  const { pathname } = useLocation();
  useEffect(() => {
    onClose();
  }, [pathname]);

  // Try to find an updated version of the item!
  let item = currentItem?.item && maybeFindItem(currentItem.item, stores);
  // Apply socket overrides to customize the item (e.g. from a loadout)
  if (item && defs && currentItem?.extraInfo?.socketOverrides) {
    item = applySocketOverrides(itemCreationContext, item, currentItem.extraInfo.socketOverrides);
  }

  if (!currentItem || !item) {
    return null;
  }

  return (
    <Suspense fallback={null}>
      <ItemPopup
        key={item.index}
        item={item}
        boundarySelector={boundarySelector}
        element={currentItem.element}
        extraInfo={currentItem.extraInfo}
        onClose={onClose}
      />
    </Suspense>
  );
}

/**
 * The passed in item may be old - look through stores to try and find a newer version!
 * This helps with items that have objectives, like Pursuits.
 *
 * TODO: This doesn't work for the synthetic items created for Milestones.
 */
function maybeFindItem(item: DimItem, stores: DimStore[]) {
  // Don't worry about non-instanced items
  if (!item.instanced) {
    return item;
  }

  for (const store of stores) {
    for (const storeItem of store.items) {
      if (storeItem.id === item.id) {
        return storeItem;
      }
    }
  }
  // Didn't find it, use what we've got.
  return item;
}
