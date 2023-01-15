import { DestinyVersion } from '@destinyitemmanager/dim-api-types';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import { lazy, Suspense, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router';
import { endCompareSession } from './actions';
import { compareSessionSelector } from './selectors';

const Compare = lazy(() => import(/* webpackChunkName: "compare" */ './Compare'));

export default function CompareContainer({ destinyVersion }: { destinyVersion: DestinyVersion }) {
  const session = useSelector(compareSessionSelector);
  const show = Boolean(session);
  const dispatch = useThunkDispatch();

  // Reset on path changes and unmount
  const { pathname } = useLocation();
  useEffect(
    () => () => {
      dispatch(endCompareSession());
    },
    [dispatch, pathname]
  );

  useEffect(() => {
    if (show && destinyVersion !== undefined) {
      ga('send', 'pageview', `/profileMembershipId/d${destinyVersion}/compare`);
    }
  }, [destinyVersion, show]);

  if (!session) {
    return null;
  }

  return (
    <Suspense fallback={null}>
      <Compare session={session} />
    </Suspense>
  );
}
