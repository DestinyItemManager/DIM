import { createAction } from 'typesafe-actions';
import { ClarityCharacterStats } from './descriptions/character-stats';
import { ClarityDescription } from './descriptions/descriptionInterface';

export const loadDescriptions =
  createAction('loadDescriptions')<
    readonly [ClarityDescription | undefined, ClarityCharacterStats | undefined]
  >();
