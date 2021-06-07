import { useDispatch } from 'react-redux';
import { setSettingAction } from './actions';

export function useSetSetting() {
  const dispatch = useDispatch();
  return (...args: Parameters<typeof setSettingAction>) => dispatch(setSettingAction(...args));
}
