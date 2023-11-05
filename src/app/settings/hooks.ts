import { settingSelector } from 'app/dim-api/selectors';
import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setSettingAction } from './actions';
import { Settings } from './initial-settings';

/** A convenience for being able to dispatch an arbitrary setting action. */
export function useSetSetting() {
  const dispatch = useDispatch();
  return useCallback(
    (...args: Parameters<typeof setSettingAction>) => dispatch(setSettingAction(...args)),
    [dispatch],
  );
}

/**
 * Used like useState, but loads and saves a value from DIM's Settings.
 *
 * @example
 *
 * const [showNewItems, setShowNewItems] = useSetting('showNewItems');
 */
export function useSetting<K extends keyof Settings>(
  settingName: K,
): [Setting: Settings[K], setSetting: (arg: Settings[K]) => void] {
  const dispatch = useDispatch();
  const settingValue = useSelector(settingSelector(settingName));
  const setter = useCallback(
    (value: Settings[K]) => dispatch(setSettingAction(settingName, value)),
    [dispatch, settingName],
  );
  return [settingValue, setter];
}
