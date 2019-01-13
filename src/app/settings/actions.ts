import { createStandardAction, createAction } from 'typesafe-actions';
import { Settings } from './reducer';

/** Bulk update settings after they've been loaded. */
export const loaded = createStandardAction('settings/LOADED')<Partial<Settings>>();

/** This one seems a bit like cheating, but it lets us set a specific property. */
export const setSetting = createAction('settings/SET', (resolve) => {
  return (property: keyof Settings, value: any) => resolve({ property, value });
});

/** This one seems a bit like cheating, but it lets us set a specific property of the farming settings. */
export const setFarmingSetting = createAction('settings/SET_FARMING', (resolve) => {
  return (property: keyof Settings['farming'], value: any) => resolve({ property, value });
});

/** Update a collapsible section */
export const toggleCollapsedSection = createStandardAction('settings/COLLAPSIBLE')<string>();

/** Set the custom character order */
export const setCharacterOrder = createStandardAction('settings/CHARACTER_ORDER')<string[]>();
