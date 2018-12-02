import { Reducer } from 'redux';
import * as actions from './actions';
import { ActionType, getType } from 'typesafe-actions';
import { DimItem } from '../inventory/item-types';
import { InventoryCuratedRoll } from './curatedRollService';
import { RootState } from '../store/reducers';
import * as _ from 'lodash';

export const curationsSelector = (state: RootState) => state.curations;

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
  return _.keyBy(inventoryCuratedRolls, (i) => i.id);
}

export function getInventoryCuratedRoll(
  item: DimItem,
  curations: CurationsState['curations']
): InventoryCuratedRoll | undefined {
  return curations[item.id];
}
