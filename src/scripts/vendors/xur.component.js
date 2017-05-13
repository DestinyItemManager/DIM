import template from './xur.html';

export const Xur = {
  template: template,
  controller: XurController
};

function XurController(dimXurService) {
  'ngInject';
  this.xurService = dimXurService;
}
