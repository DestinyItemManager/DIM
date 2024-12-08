import { resetRouterLocation } from 'app/shell/actions';
import { routerLocationSelector } from 'app/shell/selectors';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router';

/**
 * Component used to auto-navigate to a selected route selected through
 * the Redux store using the setRouterLocation action
 */
export function LocationSwitcher() {
  const location = useSelector(routerLocationSelector);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    if (location) {
      navigate(location);
      dispatch(resetRouterLocation());
    }
  }, [dispatch, location, navigate]);

  return null;
}
