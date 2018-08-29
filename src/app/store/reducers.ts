import { combineReducers } from 'redux';
import { ShellState, shell } from '../shell/reducer';

// See https://github.com/piotrwitek/react-redux-typescript-guide#redux

export interface RootState {
  readonly shell: ShellState;
}

export default combineReducers({
  shell
});
