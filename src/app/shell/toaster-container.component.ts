import { IComponentOptions } from 'angular';

export const ToasterContainerComponent: IComponentOptions = {
  template:
    '<toaster-container toaster-options="{ \'time-out\': 10000, limit: 6 }"></toaster-container>'
};
