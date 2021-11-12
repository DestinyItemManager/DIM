import { loadingEnd, loadingStart } from 'app/shell/actions';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import { useEffect } from 'react';

/**
 * This component can be used to show a page-level loading screen with an optional message.
 */
export default function ShowPageLoading({ message }: { message: string }) {
  const dispatch = useThunkDispatch();
  useEffect(() => {
    dispatch(loadingStart(message));
    return () => {
      dispatch(loadingEnd(message));
    };
  }, [dispatch, message]);

  return null;
}
