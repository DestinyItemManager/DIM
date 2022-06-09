import { createAction } from 'typesafe-actions';
import { ClarityDescription } from './descriptions/descriptionInterface';

/**
 * Download new descriptions from Clarity API
 */
export const fetchClarityDescriptions = createAction(
  'fetchClarityDescriptions'
)<ClarityDescription>();

export const toggleDescriptions = createAction('toggleDescriptions')();
