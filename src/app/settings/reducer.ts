import _ from 'lodash';
import { RootState } from 'app/store/reducers';

export const settingsSelector = (state: RootState) => state.dimApi.settings;
