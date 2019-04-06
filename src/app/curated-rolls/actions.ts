import { createStandardAction } from 'typesafe-actions';
import { CuratedRoll } from './curatedRoll';

export const loadCurations = createStandardAction('curations/LOAD')<CuratedRoll[]>();

export const clearCurations = createStandardAction('curations/CLEAR')();
