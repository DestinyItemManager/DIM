import { createStandardAction } from 'typesafe-actions';
import { WishListAndInfo } from './types';

export const loadWishLists = createStandardAction('wishlists/LOAD')<WishListAndInfo>();

export const clearWishLists = createStandardAction('wishlists/CLEAR')();
