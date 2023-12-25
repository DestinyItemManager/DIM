import { DimStore } from 'app/inventory/store-types';
import { InGameLoadout, Loadout } from 'app/loadout-drawer/loadout-types';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import { useCallback } from 'react';
import { useDrag } from 'react-dnd';
import { useSelector } from 'react-redux';
import { rootStateSelector, streamDeckSelectionSelector } from './selectors';
import { findSubClassIcon } from './util/icons';

type useStreamDeckLoadoutSelectionArgs =
  | {
      type: 'game';
      equippable: boolean;
      loadout: InGameLoadout;
    }
  | {
      type: 'classic';
      equippable: boolean;
      loadout: Loadout;
      store: DimStore;
    };

export const useStreamDeckLoadoutSelection = ({
  equippable,
  ...props
}: useStreamDeckLoadoutSelectionArgs) => {
  const streamDeckSelection = $featureFlags.elgatoStreamDeck
    ? // eslint-disable-next-line
      useSelector(streamDeckSelectionSelector)
    : null;

  const isDraggable = equippable && streamDeckSelection === 'loadout';

  const rootState = useSelector(rootStateSelector);

  const [_collected, dragRef] = useDrag(() => ({
    type: 'loadout',
  }));

  const onDragStart = $featureFlags.elgatoStreamDeck
    ? // eslint-disable-next-line
      useCallback(
        (e: React.DragEvent<HTMLDivElement>) => {
          const { type, loadout } = props;
          switch (type) {
            case 'game':
              e.dataTransfer.setData(
                'text/plain',
                JSON.stringify({
                  type: 'loadout',
                  loadout: loadout.id,
                  label: loadout.name,
                  character: loadout.characterId,
                  inGameIcon: {
                    icon: loadout.icon,
                    background: loadout.colorIcon,
                  },
                }),
              );
              break;
            case 'classic': {
              const isAnyClass = loadout.classType === DestinyClass.Unknown;
              e.dataTransfer.setData(
                'text/plain',
                JSON.stringify({
                  type: 'loadout',
                  loadout: loadout.id,
                  label: loadout.name.toUpperCase(),
                  subtitle: (isAnyClass ? '' : props.store.className) || loadout.notes || '-',
                  character: isAnyClass ? undefined : props.store.id,
                  icon: findSubClassIcon(props.loadout.items, rootState),
                }),
              );
              break;
            }
          }
        },
        [props, rootState],
      )
    : undefined;

  return {
    ref: isDraggable ? dragRef : undefined,
    onDragStart: isDraggable ? onDragStart : undefined,
  };
};
