import { ReactStateDeclaration } from '@uirouter/react';
import { states as destiny1States } from './destiny1/routes.lazy';
import { states as destiny2States } from './destiny2/routes';
import { defaultAccountRoute } from './shell/default-account.route';
import { states as whatsNewStates } from './whats-new/routes';
import { states as builderStates } from './d2-loadout-builder/routes';
import { states as loginStates } from './login/routes';
import { states as progressStates } from './progress/routes';
import { states as vendorsStates } from './d2-vendors/routes';
import { states as collectionsStates } from './collections/routes';
import { states as settingsStates } from './settings/routes';
import { states as shellStates } from './shell/routes';

export const states: ReactStateDeclaration[] = [
  defaultAccountRoute,
  ...destiny1States,
  ...destiny2States,
  ...whatsNewStates,
  ...builderStates,
  ...loginStates,
  ...progressStates,
  ...vendorsStates,
  ...collectionsStates,
  ...settingsStates,
  ...shellStates,
  // Only include developer stuff in the bundle in dev
  // tslint:disable-next-line:no-require-imports
  ...($DIM_FLAVOR === 'dev' ? require('./developer/routes').states : [])
];
