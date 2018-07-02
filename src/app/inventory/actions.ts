import { createStandardAction } from "typesafe-actions";
import { DimStore } from "./store-types";
import { DimItem } from "./item-types";

/**
 * Reflect the old stores service data into the Redux store as a migration aid.
 */
export const update = createStandardAction('inventory/UPDATE')<DimStore[]>();

/**
 * Move an item from one store to another.
 */
export const moveItem = createStandardAction('inventory/MOVE_ITEM')<{
  item: DimItem;
  source: DimStore;
  target: DimStore;
  equip: boolean;
  amount: number;
}>();

// TODO: tags/notes should probably be their own part of state
export const setTag = createStandardAction('inventory/SET_TAG')<{
  itemId: string;
  tag: string;
}>();

// TODO: Ratings!
