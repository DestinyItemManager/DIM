import { createAction } from 'typesafe-actions';

/** Started farming a particular store */
export const start = createAction('farming/START')<string>();

/** Stopped farming */
export const stop = createAction('farming/STOP')();

/** Temporarily interrupt farming */
export const interruptFarming = createAction('farming/INTERRUPT')();
/** Resume an interruption */
export const resumeFarming = createAction('farming/RESUME')();
