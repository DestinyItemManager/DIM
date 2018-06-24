import { combineReducers } from 'redux';

export interface RootState {
  dummy: string;
}

export const initialState: RootState = {
  dummy: "hello"
};

export default combineReducers({

});
