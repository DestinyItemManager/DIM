import { createStandardAction } from 'typesafe-actions';
import { D2RatingData } from './d2-dtr-api-types';
import { D1RatingData } from './d1-dtr-api-types';

/**
 * Reflect the old stores service data into the Redux store as a migration aid.
 */
export const updateRatings = createStandardAction('ratings/UPDATE')<{
  maxTotalVotes: number;
  itemStores: (D2RatingData | D1RatingData)[];
}>();
