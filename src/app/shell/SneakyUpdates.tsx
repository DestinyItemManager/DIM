import { dimNeedsUpdate$, reloadDIM } from 'app/register-service-worker';
import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router';

/**
 * "Sneaky Updates" - reload on navigation if DIM needs an update.
 */
export default function SneakyUpdates() {
  const { pathname } = useLocation();
  const initialLoad = useRef(true);
  useEffect(() => {
    if (!initialLoad.current && dimNeedsUpdate$.getCurrentValue()) {
      reloadDIM();
    }
    initialLoad.current = false;
  }, [pathname]);

  return null;
}
