/**
 * A simple item grid that manages its own item popup separate from the global popup. Useful for showing items within a sheet.
 */

import ItemPopup from 'app/item-popup/ItemPopup';
import React, { useCallback, useRef, useState } from 'react';
import ConnectedInventoryItem from '../inventory/ConnectedInventoryItem';
import { DimItem } from '../inventory/item-types';

interface PopupState {
  item: DimItem;
  element: HTMLElement;
}

export default function ItemGrid({
  items,
  noLink,
}: {
  items: DimItem[];
  /** Don't allow opening Armory from the header link */
  noLink?: boolean;
}) {
  const [popup, setPopup] = useState<PopupState | undefined>();

  return (
    <div className="sub-bucket">
      {items.map((i) => (
        <BasicItemTrigger item={i} key={i.index} onShowPopup={setPopup}>
          {(ref, showPopup) => (
            <ConnectedInventoryItem innerRef={ref} onClick={showPopup} item={i} />
          )}
        </BasicItemTrigger>
      ))}
      {popup && (
        <ItemPopup
          onClose={() => setPopup(undefined)}
          item={popup.item}
          element={popup.element}
          noLink={noLink}
        />
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
    showPopup: (e: React.MouseEvent) => void,
  ) => React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const clicked = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onShowPopup({ item, element: ref.current! });
    },
    [item, onShowPopup],
  );

  return children(ref, clicked) as JSX.Element;
}
