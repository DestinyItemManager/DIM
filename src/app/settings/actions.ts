import { Settings } from './settings';
import { createStandardAction, createAction } from 'typesafe-actions';

/** Bulk update settings after they've been loaded. */
export const loaded = createStandardAction('settings/LOADED')<Settings>();

/** This one seems a bit like cheating, but it lets us set a specific property. */
export const set = createAction('settings/SET', (resolve) => {
  return (property: keyof Settings, value: any) => resolve({ property, value });
});
