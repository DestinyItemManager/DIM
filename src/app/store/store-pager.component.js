import angular from 'angular';
import Dragend from 'dragend';
import './store-pager.scss';

angular.module('dimApp')
  .component('storePager', storePager());

function storePager() {
  return {
    controller: StorePagerCtrl,
    transclude: true,
    template: '<ng-transclude></ng-transclude>'
  };
}

function StorePagerCtrl($element) {
  'ngInject';

  this.$onInit = function() {
    this.dragend = new Dragend($element[0], {
      pageClass: 'character-swipe'
    });
    console.log(this.dragend);
  };
}
