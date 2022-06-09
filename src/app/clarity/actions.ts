import { createAction } from 'typesafe-actions';
import { ClarityDescription } from './descriptions/descriptionInterface';

export const loadDescriptions = createAction('loadDescriptions')<ClarityDescription>();
