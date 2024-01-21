import { useDispatch } from 'react-redux';
import { DimThunkDispatch } from './types';
/**
 * A hook to access the redux `dispatch` function, compatible with hooks. This returns a `dispatch` that's typed
 * correctly for thunk actions.
 */
export const useThunkDispatch = useDispatch.withTypes<DimThunkDispatch>();
