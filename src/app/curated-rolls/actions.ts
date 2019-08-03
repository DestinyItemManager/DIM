import { createStandardAction } from 'typesafe-actions';
import { CuratedRollsAndInfo } from './curatedRoll';

export const loadCurationsAndInfo = createStandardAction('curations/LOAD')<CuratedRollsAndInfo>();

export const clearCurationsAndInfo = createStandardAction('curations/CLEAR')();
