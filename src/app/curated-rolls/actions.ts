import { createStandardAction } from 'typesafe-actions';
import { InventoryCuratedRoll } from './curatedRollService';

export const updateCurations = createStandardAction('curations/UPDATE')<{
  curationEnabled: boolean;
  inventoryCuratedRolls: InventoryCuratedRoll[];
}>();
