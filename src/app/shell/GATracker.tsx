import { gaPageView } from 'app/google';
import { useEffect } from 'react';
import { useLocation } from 'react-router';

/**
 * Record page views to Google Analytics.
 */
export default function GATracker() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Replace the profile membership ID so we can consolidate paths
    gaPageView(pathname.replace(/\/\d+\//, '/profileMembershipId/'));
  }, [pathname]);

  return null;
}
