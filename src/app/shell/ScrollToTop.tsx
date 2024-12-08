import { useEffect } from 'react';
import { useLocation } from 'react-router';

/**
 * https://reacttraining.com/react-router/web/guides/scroll-restoration
 *
 * We need this until we drop support for pre-Chromium Edge and iOS < 13.1:
 * https://caniuse.com/#feat=mdn-api_history_scrollrestoration
 */
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
