import { Settings } from "./settings";
import { action } from 'typesafe-actions';

export const save = (settings: Settings) => action('SETTINGS/SAVE', settings);
