import { createStandardAction } from 'typesafe-actions';
import { WishList } from './types';

export const loadWishLists = createStandardAction('wishlists/LOAD')<WishList>();

export const clearWishLists = createStandardAction('wishlists/CLEAR')();
