import { createStandardAction } from 'typesafe-actions';
import { CuratedRollsAndInfo } from './curatedRoll';

export const loadCurations = createStandardAction('curations/LOAD')<CuratedRollsAndInfo>();

export const clearCurations = createStandardAction('curations/CLEAR')();
