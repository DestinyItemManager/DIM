import { createStandardAction } from 'typesafe-actions';

/** Started farming a particular store */
export const start = createStandardAction('farming/START')<string>();

/** Stopped farming */
export const stop = createStandardAction('farming/STOP')();
