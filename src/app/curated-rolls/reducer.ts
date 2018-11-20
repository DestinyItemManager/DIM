import { Reducer } from 'redux';
import * as actions from './actions';
import { ActionType, getType } from 'typesafe-actions';
import { DimItem } from '../inventory/item-types';
import { InventoryCuratedRoll } from './curatedRollService';

export interface CurationsState {
  curationEnabled: boolean;
  curations: { [key: string]: InventoryCuratedRoll };
}

export type CurationsAction = ActionType<typeof actions>;

const initialState: CurationsState = {
  curationEnabled: false,
  curations: {}
};

export const curations: Reducer<CurationsState, CurationsAction> = (
  state: CurationsState = initialState,
  action: CurationsAction
) => {
  switch (action.type) {
    case getType(actions.updateCurations):
      return {
        curationEnabled: action.payload.curationEnabled,
        curations: curationsFromService(action.payload.inventoryCuratedRolls)
      };
    default:
      return state;
  }
};

function curationsFromService(
  inventoryCuratedRolls: InventoryCuratedRoll[]
): { [key: string]: InventoryCuratedRoll } {
  const curations: { [key: string]: InventoryCuratedRoll } = {};
  for (const inventoryCuratedRoll of inventoryCuratedRolls) {
    curations[inventoryCuratedRoll.id] = inventoryCuratedRoll;
  }

  return curations;
}

export function getInventoryCuratedRoll(
  item: DimItem,
  curations: CurationsState['curations']
): InventoryCuratedRoll | undefined {
  return curations[item.id];
}
