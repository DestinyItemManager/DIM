import { createAction } from 'typesafe-actions';
import { VendorDrop } from './vendorDrops';

export const loadVendorDrops = createAction('vendorengrams/LOAD')<VendorDrop[]>();

export const clearVendorDrops = createAction('vendorengrams/CLEAR')();
