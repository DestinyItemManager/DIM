import { RootState } from 'app/store/types';

// Note: Separate file (even from redux-utils) so that there are no non-type imports,
// as it's otherwise prone to circular import dependencies that break selectors

/**
 * Turn a selector output from reselect's createSelector which depends on some input
 * other than state, into a function that produces a selector function based on that
 * input. This makes it nicer to use in useSelector.
 *
 * Example:
 *
 * const upperStoreIdSelector = createSelector(
 *   (state: RootState, storeId: string) => storeId,
 *   (storeId) => storeId.toUpperCase()
 * )
 *
 * // Hard to put into useSelector:
 * const upperStoreId = useSelector((state: RootState) => upperStoreIdSelector(state, storeId))
 *
 * const curriedUpperStoreIdSelector = currySelector(upperStoreIdSelector)
 *
 * // Nice:
 * const upperStoreId = useSelector(curriedUpperStoreIdSelector(storeId))
 */
export function currySelector<K, R>(
  selector: (state: RootState, props: K) => R
): (props: K) => (state: RootState) => R {
  return (props: K) => (state: RootState) => selector(state, props);
}
