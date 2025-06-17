import { DimStore } from 'app/inventory/store-types';
import { hideItemPopup } from 'app/item-popup/item-popup';
import { wrap } from 'app/utils/collections';
import { animate, motion, PanInfo, Transition, useMotionValue, useTransform } from 'motion/react';
import { useEffect, useRef } from 'react';
import StoreHeading from '../character-tile/StoreHeading';
import styles from './PhoneStoresHeader.m.scss';

const spring: Transition<number> = {
  type: 'spring',
  stiffness: 100,
  damping: 20,
  mass: 1,
  restSpeed: 0.01,
  restDelta: 0.01,
};

/**
 * The swipable header for the mobile (phone portrait) Inventory view.
 */
export default function PhoneStoresHeader({
  selectedStore,
  stores,
  setSelectedStoreId,
  direction,
}: {
  selectedStore: DimStore;
  stores: DimStore[];
  // The direction we changed stores in - positive for an increasing index, negative for decreasing
  direction: number;
  setSelectedStoreId: (id: string, direction: number) => void;
}) {
  const onIndexChanged = (index: number, dir: number) => {
    const originalIndex = stores.indexOf(selectedStore);
    setSelectedStoreId(stores[wrap(originalIndex + index, stores.length)].id, dir);
    hideItemPopup();
  };

  // TODO: wrap StoreHeading in a div?
  // TODO: optional external motion control

  const index = stores.indexOf(selectedStore);
  const lastIndex = useRef(index);

  const trackRef = useRef<HTMLDivElement>(null);

  // The track is divided into "segments", with one item per segment
  const numSegments = 5; // since we wrap the items, we're always showing a virtual repeating window from index -2 to +2
  const numItems = stores.length;
  // This is a floating-point, animated representation of the position within the segments, relative to the current store
  const offset = useMotionValue(0);
  // Keep track of the starting point when we begin a gesture
  const startOffset = useRef<number>(0);

  useEffect(() => {
    const velocity = offset.getVelocity();
    const newOffset = offset.get() - direction;
    offset.set(newOffset);
    animate(offset, 0, { ...spring, velocity });
    lastIndex.current = index;
  }, [index, direction, offset, numItems]);

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
    const newValue = startOffset.current + -info.offset.x / (trackWidth / numSegments);

    offset.set(newValue);
  };

  const onPanEnd = (_e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (!trackRef.current) {
      return;
    }

    // Animate to one of the settled whole-number indexes
    let newIndex = Math.round(offset.get());
    const scale = trackRef.current.clientWidth / numSegments;

    const direction = -Math.sign(info.velocity.x);
    if (newIndex === 0) {
      const swipe = (info.velocity.x * info.offset.x) / (scale * scale);
      if (swipe > 0.05) {
        newIndex = newIndex + direction;
      }
    }

    if (newIndex !== 0) {
      onIndexChanged(newIndex, direction);
    } else {
      animate(offset, 0, spring);
    }
  };

  // Expand out from the selected index in each direction 2 items
  const segments: DimStore[] = [];
  for (let i = index - 2; i <= index + 2; i++) {
    segments.push(stores[wrap(i, stores.length)]);
  }

  // Transform the segment-relative offset back into percents
  const offsetPercent = useTransform(offset, (o) => `${(100 / segments.length) * -(o + 2)}%`);

  const keys: { [key: string]: number } = {};
  const makeKey = (key: string) => {
    keys[key] ||= 0;
    keys[key]++;
    return `${key}:${keys[key]}`;
  };

  return (
    <div className={styles.frame}>
      <motion.div
        ref={trackRef}
        className={styles.track}
        onPanStart={onPanStart}
        onPan={onPan}
        onPanEnd={onPanEnd}
        style={{ width: `${100 * segments.length}%`, x: offsetPercent }}
      >
        {segments.map((store, index) => (
          <div
            className={styles.character}
            key={makeKey(store.id)}
            style={{ width: `${Math.floor(100 / segments.length)}%` }}
          >
            <StoreHeading
              store={store}
              selectedStore={selectedStore}
              onTapped={(id) => setSelectedStoreId(id, index - 2)}
            />
          </div>
        ))}
      </motion.div>
    </div>
  );
}
