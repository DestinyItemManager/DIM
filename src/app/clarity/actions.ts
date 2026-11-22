import { createAction } from 'typesafe-actions';
import { ClarityDescription } from './descriptions/descriptionInterface';

export const loadDescriptions = createAction('CLARITY/LOAD_DESCRIPTIONS')<
  ClarityDescription | undefined
>();
