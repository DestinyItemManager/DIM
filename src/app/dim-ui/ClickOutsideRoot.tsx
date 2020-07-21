import React, { useState } from 'react';
import { ClickOutsideContext } from './ClickOutside';
import { Subject } from 'rxjs';

/**
 * The root element that lets ClickOutside work. This defines the
 * "Outside" for any ClickOutside children.
 */
export default function ClickOutsideRoot({ children }: { children: React.ReactNode }) {
  const [clickOutsideSubject] = useState(() => new Subject<React.MouseEvent>());

  const onClick = (e: React.MouseEvent) => {
    clickOutsideSubject.next(e);
  };

  return (
    <ClickOutsideContext.Provider value={clickOutsideSubject}>
      <div onClick={onClick}>{children}</div>
    </ClickOutsideContext.Provider>
  );
}
