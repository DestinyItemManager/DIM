import { useEffect, useState } from 'react';
import hotkeys, { Hotkey } from './hotkeys';

let componentId = 0;

export default function GlobalHotkeys({
  hotkeys: hotkeyDefs,
  children,
}: {
  hotkeys: Hotkey[];
  children?: any;
}) {
  const [id] = useState(() => componentId++);
  useEffect(() => {
    hotkeys.register(id, hotkeyDefs);
    return () => hotkeys.unregister(id);
  });

  return children || null;
}
