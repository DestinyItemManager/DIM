import { DimItem } from 'app/inventory/item-types';
import { DimStore } from 'app/inventory/store-types';
import { InGameLoadout, Loadout } from 'app/loadout-drawer/loadout-types';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import { RootState, ThunkResult } from 'app/store/types';
import { DamageType, DestinyClass } from 'bungie-api-ts/destiny2';
import { useCallback } from 'react';
import { useDrag } from 'react-dnd';
import { useSelector } from 'react-redux';
import { streamDeckSelectionSelector } from './selectors';
import { findSubClassIcon } from './util/icons';

export type StreamDeckSelectionOptions =
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
    };

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
        item: item.index.replace(/-.*/, ''),
        icon: item.icon,
        overlay: item.iconOverlay,
        isExotic: item.isExotic,
        inventory: item.location.accountWide,
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
};

interface UseStreamDeckSelectionReturn {
  ref?: React.Ref<HTMLDivElement>;
  onDragStart?: React.DragEventHandler<HTMLDivElement>;
}

const useStreamDeckSelection = ({
  equippable,
  ...props
}: UseStreamDeckSelectionArgs): UseStreamDeckSelectionReturn => {
  const dispatch = useThunkDispatch();
  const type = props.type === 'item' ? 'item' : 'loadout';
  const selection = useSelector(streamDeckSelectionSelector);
  const canDrag = equippable && selection === type;
  const [_coll, dragRef] = useDrag(() => ({
    type,
  }));

  const onDragStart = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => dispatch(setDataTransfer(e, props)),
    [dispatch, props],
  );

  return {
    ref: canDrag ? dragRef : undefined,
    onDragStart: canDrag ? onDragStart : undefined,
  };
};

export type UseStreamDeckSelectionFn = typeof useStreamDeckSelection;

export default { useStreamDeckSelection };
