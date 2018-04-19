import template from './objectives.html';
import './objectives.scss';
import { IComponentOptions } from 'angular';

export const ObjectivesComponent: IComponentOptions = {
  bindings: {
    objectives: '<'
  },
  template
};
