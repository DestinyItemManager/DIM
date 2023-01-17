/**
 * A simple item grid that manages its own item popup separate from the global popup. Useful for showing items within a sheet.
 */

import ItemPopup from 'app/item-popup/ItemPopup';
import { Portal } from 'app/utils/temp-container';
import React, { useCallback, useRef, useState } from 'react';
import ConnectedInventoryItem from '../inventory/ConnectedInventoryItem';
import { DimItem } from '../inventory/item-types';

interface PopupState {
  item: DimItem;
  element: HTMLElement;
}

function useZIndex(): [number, React.RefCallback<HTMLDivElement>] {
  const zIndex = useRef<number>(0);
  const measureRef = useCallback((el: HTMLDivElement) => {
    zIndex.current = getZIndex(el);
  }, []);

  return [zIndex.current, measureRef];
}

function getZIndex(e: HTMLElement): number {
  if (!e) {
    return 0;
  }
  let z: string | undefined;
  try {
    z = document.defaultView?.getComputedStyle(e).getPropertyValue('z-index');
  } catch (e) {
    return 0;
  }
  if (!z) {
    return 0;
  }
  if (e.parentNode && (!z || isNaN(parseInt(z, 10)))) {
    return getZIndex(e.parentNode as HTMLElement);
  }
  return parseInt(z, 10);
}

export default function ItemGrid({
  items,
  noLink,
}: {
  items: DimItem[];
  /** Don't allow opening Armory from the header link */
  noLink?: boolean;
}) {
  const [zIndex, measureRef] = useZIndex();
  const [popup, setPopup] = useState<PopupState | undefined>();

  return (
    <div className="sub-bucket" ref={measureRef}>
      {items.map((i) => (
        <BasicItemTrigger item={i} key={i.index} onShowPopup={setPopup}>
          {(ref, showPopup) => (
            <ConnectedInventoryItem innerRef={ref} onClick={showPopup} item={i} />
          )}
        </BasicItemTrigger>
      ))}
      {popup && (
        <Portal>
          <ItemPopup
            onClose={() => setPopup(undefined)}
            item={popup.item}
            element={popup.element}
            zIndex={zIndex + 1}
            noLink={noLink}
          />
        </Portal>
      )}
    </div>
  );
}

function BasicItemTrigger({
  item,
  onShowPopup,
  children,
}: {
  item: DimItem;
  onShowPopup: (state: PopupState) => void;
  children: (
    ref: React.Ref<HTMLDivElement>,
    showPopup: (e: React.MouseEvent) => void
  ) => React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const clicked = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onShowPopup({ item, element: ref.current! });
    },
    [item, onShowPopup]
  );

  return children(ref, clicked) as JSX.Element;
}
