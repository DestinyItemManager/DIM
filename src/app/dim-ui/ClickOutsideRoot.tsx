import { EventBus } from 'app/utils/observable';
import React, { useState } from 'react';
import { ClickOutsideContext } from './ClickOutside';

/**
 * The root element that lets ClickOutside work. This defines the
 * "Outside" for any ClickOutside children.
 *
 * This uses a parent element that's connected through context so we can continue to work within the
 * React DOM hierarchy rather than the real one. This is important for things like sheets
 * spawned through portals from the item popup.
 */
export default function ClickOutsideRoot({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const [clickOutsideSubject] = useState(() => new EventBus<React.MouseEvent>());

  const onClick = (e: React.MouseEvent) => {
    clickOutsideSubject.next(e);
  };

  return (
    <ClickOutsideContext value={clickOutsideSubject}>
      <div className={className} onClick={onClick}>
        {children}
      </div>
    </ClickOutsideContext>
  );
}
