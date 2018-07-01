import template from './flavor-objective.html';
import './flavor-objective.scss';
import { IComponentOptions } from 'angular';

export const FlavorObjectiveComponent: IComponentOptions = {
  bindings: {
    objective: '<'
  },
  template
};
