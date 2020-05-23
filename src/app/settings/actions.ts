import { createAction, PayloadAction } from 'typesafe-actions';
import { Settings } from './initial-settings';

/** Bulk update settings after they've been loaded. */
export const loaded = createAction('settings/LOADED')<Partial<Settings>>();

/** This one seems a bit like cheating, but it lets us set a specific property. */
export const setSetting = createAction(
  'settings/SET',
  <V extends keyof Settings>(property: V, value: Settings[V]) => ({
    property,
    value,
  })
)() as <V extends keyof Settings>(
  property: V,
  value: Settings[V]
) => PayloadAction<'settings/SET', { property: V; value: Settings[V] }>;

/** Update a collapsible section */
export const toggleCollapsedSection = createAction('settings/COLLAPSIBLE')<string>();

/** Set the custom character order */
export const setCharacterOrder = createAction('settings/CHARACTER_ORDER')<string[]>();
