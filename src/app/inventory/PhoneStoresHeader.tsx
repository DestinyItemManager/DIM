import { hideItemPopup } from 'app/item-popup/item-popup';
import { animate, motion, PanInfo, useMotionValue, useTransform } from 'framer-motion';
import _ from 'lodash';
import React, { useRef } from 'react';
import StoreHeading from '../character-tile/StoreHeading';
import styles from './PhoneStoresHeader.m.scss';
import { DimStore } from './store-types';

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

  const index = stores.indexOf(selectedStore);

  // TODO: this seems a bit too low level
  const frameRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  // The track is divided into "segments", with one item per segment
  const numSegments = stores.length;
  // This is a floating-point, animated representation of the position within the segments!
  const offset = useMotionValue(index);
  // Keep track of the starting point when we begin a gesture
  const startOffset = useRef<number>(0);

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

  const onPanEnd = (_e, _info: PanInfo) => {
    // Animate to one of the settled whole-number indexes
    // TODO: kill velocity?
    const newIndex = _.clamp(Math.round(offset.get()), 0, numSegments - 1);
    // TODO: velocity+distance threshold to pop to the next item (distance as a proportion of segment)
    animate(offset, newIndex);

    if (index !== newIndex) {
      onIndexChanged(newIndex);
    }
  };

  // Transform the segment-relative offset back into pixels
  const offsetPercent = useTransform(offset, (o) =>
    trackRef.current ? (trackRef.current.clientWidth / numSegments) * -o : 0
  );

  return (
    <div className={styles.frame} ref={frameRef}>
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
