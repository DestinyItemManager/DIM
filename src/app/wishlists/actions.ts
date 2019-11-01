import { createAction } from 'typesafe-actions';
import { WishListAndInfo } from './types';

export const loadWishLists = createAction('wishlists/LOAD')<WishListAndInfo>();

export const clearWishLists = createAction('wishlists/CLEAR')();
