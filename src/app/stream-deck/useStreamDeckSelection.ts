import { LoadoutItem } from '@destinyitemmanager/dim-api-types';
import { DimItem } from 'app/inventory/item-types';
import { DimStore } from 'app/inventory/store-types';
import { InGameLoadout, Loadout } from 'app/loadout/loadout-types';
import { d2ManifestSelector } from 'app/manifest/selectors';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import { RootState, ThunkResult } from 'app/store/types';
import { DamageType, DestinyClass } from 'bungie-api-ts/destiny2';
import { BucketHashes } from 'data/d2/generated-enums';
import { useCallback } from 'react';
import { useDrag } from 'react-dnd';
import { useSelector } from 'react-redux';
import { streamDeckSelectionSelector } from './selectors';
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

const toSelection = (data: StreamDeckSelectionOptions, state: RootState) => {
  switch (data.type) {
    case 'in-game-loadout': {
      const { loadout } = data;
      return {
        type: 'loadout',
        loadout: loadout.id,
        label: loadout.name,
        character: loadout.characterId,
        inGameIcon: {
          icon: loadout.icon,
          background: loadout.colorIcon,
        },
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

const setDataTransfer =
  (e: React.DragEvent<HTMLDivElement>, data: StreamDeckSelectionOptions): ThunkResult =>
  async (_, getState) => {
    const state = getState();
    e.dataTransfer.setData('text/plain', JSON.stringify(toSelection(data, state)));
  };

export type UseStreamDeckSelectionArgs = StreamDeckSelectionOptions & {
  equippable: boolean;
  isSubClass?: boolean;
};

interface UseStreamDeckSelectionReturn {
  ref?: React.Ref<HTMLDivElement>;
  onDragStart?: React.DragEventHandler<HTMLDivElement>;
}

const useSelection = ({
  equippable,
  ...props
}: UseStreamDeckSelectionArgs): UseStreamDeckSelectionReturn => {
  const dispatch = useThunkDispatch();
  const type = props.type === 'item' ? 'item' : 'loadout';
  const selection = useSelector(streamDeckSelectionSelector);
  const canDrag = (equippable || props.isSubClass) && selection === type;
  const [_coll, dragRef] = useDrag(() => ({
    type,
  }));

  const onDragStart = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => dispatch(setDataTransfer(e, props)),
    [dispatch, props],
  );

  if (canDrag) {
    return {
      ref: dragRef,
      onDragStart: onDragStart,
    };
  }

  return {};
};

export type UseStreamDeckSelectionFn = typeof useSelection;

export default { useSelection };
