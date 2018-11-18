import { module } from 'angular';

import loadoutBuilderModule from '../loadout-builder/loadout-builder.module';

export { states } from './routes';

const mod = module('destiny1Module', [loadoutBuilderModule]);

export const angularModule = mod;
