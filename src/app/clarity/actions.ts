import { createAction } from 'typesafe-actions';
import { ClarityDescription } from './descriptionInterface';

/**
 * Download new descriptions from Clarity API
 */
export const fetchClarityDescriptions = createAction(
  'fetchClarityDescriptions'
)<ClarityDescription>();
