import { module } from 'angular';

import { ToasterContainerComponent } from './toaster-container.component';

export const ShellModule = module('dimShell', []).component(
  'dimToasterContainer',
  ToasterContainerComponent
).name;
