import { createStandardAction } from 'typesafe-actions';
import { InventoryCuratedRoll } from './curatedRollService';

/**
 * Reflect the old stores service data into the Redux store as a migration aid.
 */
export const updateCurations = createStandardAction('curations/UPDATE')<{
  curationEnabled: boolean;
  inventoryCuratedRolls: InventoryCuratedRoll[];
}>();
