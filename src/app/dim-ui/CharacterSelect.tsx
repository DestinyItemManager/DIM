import { hideItemPopup } from 'app/item-popup/item-popup';
import { useIsPhonePortrait } from 'app/shell/selectors';
import { infoLog } from 'app/utils/log';
import clsx from 'clsx';
import { clamp } from 'es-toolkit';
import { animate, motion, PanInfo, Transition, useMotionValue, useTransform } from 'motion/react';
import { useEffect, useRef } from 'react';
import CharacterTileButton from '../character-tile/CharacterTileButton';
import { DimStore } from '../inventory/store-types';
import styles from './CharacterSelect.m.scss';

const spring: Transition<number> = {
  type: 'spring',
  stiffness: 100,
  damping: 20,
  mass: 1,
  restSpeed: 0.01,
  restDelta: 0.01,
};

/**
 * The swipable header for selecting from a list of characters.
 *
 * This is currently a copy/paste of PhoneStoresHeader once both are done, if they are still similar, recombine them.
 */
export default function CharacterSelect({
  stores,
  selectedStore,
  onCharacterChanged,
}: {
  stores: DimStore[];
  selectedStore: DimStore;
  onCharacterChanged: (storeId: string) => void;
}) {
  const isPhonePortrait = useIsPhonePortrait();
  stores = stores.filter((s) => !s.isVault);

  if (!isPhonePortrait) {
    return (
      <ListCharacterSelect
        stores={stores}
        selectedStore={selectedStore}
        onCharacterChanged={onCharacterChanged}
      />
    );
  }

  return (
    <SwipableCharacterSelect
      stores={stores}
      selectedStore={selectedStore}
      onCharacterChanged={onCharacterChanged}
    />
  );
}

function ListCharacterSelect({
  stores,
  selectedStore,
  onCharacterChanged,
}: {
  stores: DimStore[];
  selectedStore: DimStore;
  onCharacterChanged: (storeId: string) => void;
}) {
  return (
    <div className={styles.vertical}>
      {stores.map((store) => (
        <div
          key={store.id}
          className={clsx(styles.tile, {
            [styles.unselected]: store.id !== selectedStore.id,
          })}
        >
          <CharacterTileButton character={store} onClick={onCharacterChanged} />
        </div>
      ))}
    </div>
  );
}

function SwipableCharacterSelect({
  stores,
  selectedStore,
  onCharacterChanged,
}: {
  stores: DimStore[];
  selectedStore: DimStore;
  onCharacterChanged: (storeId: string) => void;
}) {
  const onIndexChanged = (index: number) => {
    onCharacterChanged(stores[index].id);
    hideItemPopup();
  };

  // TODO: carousel
  // TODO: wrap StoreHeading in a div?
  // TODO: optional external motion control

  const index = stores.indexOf(selectedStore);

  const trackRef = useRef<HTMLDivElement>(null);

  // The track is divided into "segments", with one item per segment
  const numSegments = stores.length;
  // This is a floating-point, animated representation of the position within the segments!
  const offset = useMotionValue(index);
  // Keep track of the starting point when we begin a gesture
  const startOffset = useRef<number>(0);

  useEffect(() => {
    const index = stores.indexOf(selectedStore);
    animate(offset, index, spring);
  }, [selectedStore, offset, stores]);

  // We want a bit more control than Framer Motion's drag gesture can give us, so fall
  // back to the pan gesture and implement our own elasticity, etc.
  const onPanStart = () => {
    startOffset.current = offset.get();
  };

  const onPan = (_e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (!trackRef.current) {
      return;
    }
    const trackWidth = trackRef.current.clientWidth;
    // The offset as a proportion of segments
    let newValue = startOffset.current + -info.offset.x / (trackWidth / numSegments);

    // Apply elasticity outside the extents
    const elasticity = 0.5;
    const minExtent = 0;
    const maxExtent = numSegments - 1;
    if (newValue < minExtent) {
      newValue = elasticity * newValue;
    } else if (newValue > maxExtent) {
      newValue = elasticity * (newValue - maxExtent) + maxExtent;
    }
    offset.set(newValue);
  };

  const onPanEnd = (_e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (!trackRef.current) {
      return;
    }
    // Animate to one of the settled whole-number indexes
    let newIndex = clamp(Math.round(offset.get()), 0, numSegments - 1);
    const scale = trackRef.current.clientWidth / numSegments;

    if (index === newIndex) {
      const swipe = (info.velocity.x * info.offset.x) / (scale * scale);
      infoLog('swipe', swipe);
      if (swipe > 0.05) {
        const direction = -Math.sign(info.velocity.x);
        newIndex = clamp(newIndex + direction, 0, numSegments - 1);
      }
    }

    animate(offset, newIndex, spring);

    if (index !== newIndex) {
      onIndexChanged(newIndex);
    }
  };

  // Transform the segment-relative offset back into pixels
  const offsetPercent = useTransform(offset, (o) =>
    trackRef.current ? (trackRef.current.clientWidth / numSegments) * -o : 0,
  );

  return (
    <div className={styles.frame}>
      <motion.div
        ref={trackRef}
        className={styles.track}
        onPanStart={onPanStart}
        onPan={onPan}
        onPanEnd={onPanEnd}
        style={{ width: `${100 * stores.length}%`, x: offsetPercent }}
      >
        {stores.map((store) => (
          <div
            key={store.id}
            style={{ width: `${100 / stores.length}%` }}
            className={clsx(styles.tile, {
              [styles.unselected]: store.id !== selectedStore.id,
            })}
          >
            <CharacterTileButton character={store} onClick={onCharacterChanged} />
          </div>
        ))}
      </motion.div>
    </div>
  );
}
