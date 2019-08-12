import { createStandardAction } from 'typesafe-actions';
import { CuratedRollsAndInfo } from './curatedRoll';

export const loadWishLists = createStandardAction('wishlists/LOAD')<CuratedRollsAndInfo>();

export const clearWishLists = createStandardAction('wishlists/CLEAR')();
