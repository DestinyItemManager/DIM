import { createStandardAction } from "typesafe-actions";

/** Set whether we're in phonePortrait view mode. */
export const setPhonePortrait = createStandardAction('shell/PHONE_PORTRAIT')<boolean>();
