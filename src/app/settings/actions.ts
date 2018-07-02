import { Settings } from "./settings";
import { action } from 'typesafe-actions';

/** Bulk update settings after they've been loaded. */
export const loaded = (settings: Settings) => action('settings/LOADED', settings);

/** This one seems a bit like cheating, but it lets us set a specific property. */
export const set = (property: keyof Settings, value: any) => action('settings/SET', { property, value });
