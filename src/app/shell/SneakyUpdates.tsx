import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { dimNeedsUpdate, reloadDIM } from 'app/register-service-worker';

/**
 * "Sneaky Updates" - reload on navigation if DIM needs an update.
 */
export default function SneakyUpdates() {
  const { pathname } = useLocation();
  const initialLoad = useRef(true);
  useEffect(() => {
    if (!initialLoad.current && dimNeedsUpdate) {
      reloadDIM();
    }
    initialLoad.current = false;
  }, [pathname]);

  return null;
}
