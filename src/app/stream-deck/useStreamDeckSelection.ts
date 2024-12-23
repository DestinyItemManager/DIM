import { LoadoutItem } from '@destinyitemmanager/dim-api-types';
import { DimItem } from 'app/inventory/item-types';
import { DimStore } from 'app/inventory/store-types';
import { InGameLoadout, Loadout } from 'app/loadout/loadout-types';
import { d2ManifestSelector } from 'app/manifest/selectors';
import { RootState } from 'app/store/types';
import { DamageType, DestinyClass } from 'bungie-api-ts/destiny2';
import { BucketHashes } from 'data/d2/generated-enums';
import { useSelector } from 'react-redux';
import { streamDeckSelectionSelector } from './selectors';
import { STREAM_DECK_DEEP_LINK } from './util/authorization';
import { streamDeckClearId } from './util/packager';

export type StreamDeckSelectionOptions = (
  | {
      type: 'in-game-loadout';
      loadout: InGameLoadout;
    }
  | {
      type: 'loadout';
      loadout: Loadout;
      store: DimStore;
    }
  | {
      type: 'item';
      item: DimItem;
    }
) & { isSubClass?: boolean };

function findSubClassIcon(items: LoadoutItem[], state: RootState) {
  const defs = d2ManifestSelector(state);
  for (const item of items) {
    const def = defs?.InventoryItem.get(item.hash);
    // find subclass item
    if (def?.inventory?.bucketTypeHash === BucketHashes.Subclass) {
      return def.displayProperties.icon;
    }
  }
}

const toSelection = (data: StreamDeckSelectionOptions) => (state: RootState) => {
  switch (data.type) {
    case 'in-game-loadout': {
      const { loadout } = data;
      return {
        type: 'loadout',
        loadout: loadout.id,
        label: loadout.name,
        character: loadout.characterId,
        'inGameIcon.icon': loadout.icon,
        'inGameIcon.background': loadout.colorIcon,
      };
    }
    case 'loadout': {
      const isAnyClass = data.loadout.classType === DestinyClass.Unknown;
      const { loadout, store } = data;
      return {
        type: 'loadout',
        loadout: loadout.id,
        label: loadout.name.toUpperCase(),
        subtitle: (isAnyClass ? '' : store.className) || loadout.notes || '-',
        character: isAnyClass ? undefined : store.id,
        icon: findSubClassIcon(loadout.items, state),
      };
    }
    case 'item': {
      const { item } = data;
      return {
        type: 'item',
        label: item.name,
        subtitle: item.typeName,
        item: streamDeckClearId(item.index),
        icon: item.icon,
        overlay: item.iconOverlay,
        isExotic: item.isExotic,
        isSubClass: data.isSubClass,
        isCrafted: Boolean(item.crafted),
        element:
          item.element?.enumValue === DamageType.Kinetic
            ? undefined
            : item.element?.displayProperties?.icon,
      };
    }
  }
};

const toSelectionHref =
  (canSelect: boolean, data: StreamDeckSelectionOptions) => (state: RootState) => {
    if (!canSelect) {
      return;
    }
    const params = toSelection(data)(state);
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        query.set(key, value as string);
      }
    }
    return `${STREAM_DECK_DEEP_LINK}/selection?${query.toString()}`;
  };

export interface UseStreamDeckSelectionArgs {
  options: StreamDeckSelectionOptions;
  equippable: boolean;
}

function useSelection({ equippable, options }: UseStreamDeckSelectionArgs): string | undefined {
  const type = options.type === 'item' ? 'item' : 'loadout';
  const selection = useSelector(streamDeckSelectionSelector);
  const canSelect = Boolean((equippable || options.isSubClass) && selection === type);
  return useSelector(toSelectionHref(canSelect, options));
}

export default useSelection;

export type UseStreamDeckSelectionFn = typeof useSelection;
