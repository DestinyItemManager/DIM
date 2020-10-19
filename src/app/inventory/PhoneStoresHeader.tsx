import { hideItemPopup } from 'app/item-popup/item-popup';
import { infoLog } from 'app/utils/log';
import { animate, motion, PanInfo, Spring, useMotionValue, useTransform } from 'framer-motion';
import _ from 'lodash';
import React, { useEffect, useRef } from 'react';
import StoreHeading from '../character-tile/StoreHeading';
import styles from './PhoneStoresHeader.m.scss';
import { DimStore } from './store-types';

const spring: Spring = {
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
  loadoutMenuRef,
}: {
  selectedStore: DimStore;
  stores: DimStore[];
  loadoutMenuRef: React.RefObject<HTMLElement>;
  setSelectedStoreId(id: string): void;
}) {
  const onIndexChanged = (index: number) => {
    setSelectedStoreId(stores[index].id);
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
    animate(offset, index, spring);
  }, [index, offset]);

  // We want a bit more control than Framer Motion's drag gesture can give us, so fall
  // back to the pan gesture and implement our own elasticity, etc.
  const onPanStart = () => {
    startOffset.current = offset.get();
  };

  const onPan = (_e, info: PanInfo) => {
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

  const onPanEnd = (_e, info: PanInfo) => {
    // Animate to one of the settled whole-number indexes
    let newIndex = _.clamp(Math.round(offset.get()), 0, numSegments - 1);
    const scale = trackRef.current!.clientWidth / numSegments;

    if (index === newIndex) {
      const swipe = (info.velocity.x * info.offset.x) / (scale * scale);
      infoLog('swipe', swipe);
      if (swipe > 0.05) {
        const direction = -Math.sign(info.velocity.x);
        newIndex = _.clamp(newIndex + direction, 0, numSegments - 1);
      }
    }

    animate(offset, newIndex, spring);

    if (index !== newIndex) {
      onIndexChanged(newIndex);
    }
  };

  // Transform the segment-relative offset back into pixels
  const offsetPercent = useTransform(offset, (o) =>
    trackRef.current ? (trackRef.current.clientWidth / numSegments) * -o : 0
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
            className="store-cell"
            key={store.id}
            style={{ width: `${Math.floor(100 / stores.length)}%` }}
          >
            <StoreHeading
              store={store}
              selectedStore={selectedStore}
              onTapped={setSelectedStoreId}
              loadoutMenuRef={loadoutMenuRef}
            />
          </div>
        ))}
      </motion.div>
    </div>
  );
}
