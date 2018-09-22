import { Settings } from './settings';
import { createStandardAction } from 'typesafe-actions';

/** Bulk update settings after they've been loaded. */
export const loaded = createStandardAction('settings/LOADED')<Settings>();

/** Update a collapsible section */
export const toggleCollapsedSection = createStandardAction('settings/COLLAPSIBLE')<string>();
