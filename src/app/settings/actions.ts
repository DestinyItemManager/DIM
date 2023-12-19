import { createAction, PayloadAction } from 'typesafe-actions';
import type { Settings } from './initial-settings';

/** This one seems a bit like cheating, but it lets us set a specific property. */
export const setSettingAction = createAction(
  'settings/SET',
  <V extends keyof Settings>(property: V, value: Settings[V]) => ({
    property,
    value,
  }),
)() as <V extends keyof Settings>(
  property: V,
  value: Settings[V],
) => PayloadAction<'settings/SET', { property: V; value: Settings[V] }>;

/** Update a collapsible section */
export const toggleCollapsedSection = createAction('settings/COLLAPSIBLE')<string>();

/** Set the custom character order */
export const setCharacterOrder = createAction('settings/CHARACTER_ORDER')<string[]>();
