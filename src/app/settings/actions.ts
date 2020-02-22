import { createAction } from 'typesafe-actions';
import { Settings } from './reducer';

/** Bulk update settings after they've been loaded. */
export const loaded = createAction('settings/LOADED')<Partial<Settings>>();

/** This one seems a bit like cheating, but it lets us set a specific property. */
export const setSetting = createAction('settings/SET', (property: keyof Settings, value: any) => ({
  property,
  value
}))();

/** Update a collapsible section */
export const toggleCollapsedSection = createAction('settings/COLLAPSIBLE')<string>();

/** Set the custom character order */
export const setCharacterOrder = createAction('settings/CHARACTER_ORDER')<string[]>();
