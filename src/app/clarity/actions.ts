import { createAction } from 'typesafe-actions';
import { ClarityCharacterStats } from './descriptions/character-stats';
import { ClarityDescription } from './descriptions/descriptionInterface';

export const loadDescriptions = createAction('CLARITY/LOAD_DESCRIPTIONS')<
  ClarityDescription | undefined
>();

export const loadCharacterStats = createAction('CLARITY/LOAD_CHAR_STATS')<
  ClarityCharacterStats | undefined
>();
