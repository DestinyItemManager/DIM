import { module } from 'angular';

import loadoutBuilderModule from '../loadout-builder/loadout-builder.module';
import vendorsModule from '../vendors/vendors.module';

export { states } from './routes';

const mod = module('destiny1Module', [loadoutBuilderModule, vendorsModule]);

export const angularModule = mod;
