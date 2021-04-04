import { EventBus } from 'app/utils/observable';
import React, { useState } from 'react';
import { ClickOutsideContext } from './ClickOutside';

/**
 * The root element that lets ClickOutside work. This defines the
 * "Outside" for any ClickOutside children.
 *
 * This uses a parent element that's connected through context so we can continue to work within the
 * React DOM heirarchy rather than the real one. This is important for things like sheets
 * spawned through portals from the item popup.
 */
export default function ClickOutsideRoot({ children }: { children: React.ReactNode }) {
  const [clickOutsideSubject] = useState(() => new EventBus<React.MouseEvent>());

  const onClick = (e: React.MouseEvent) => {
    clickOutsideSubject.next(e);
  };

  return (
    <ClickOutsideContext.Provider value={clickOutsideSubject}>
      <div onClick={onClick}>{children}</div>
    </ClickOutsideContext.Provider>
  );
}
