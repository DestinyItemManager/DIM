import './page.scss';
import { IComponentOptions } from 'angular';

export const PageComponent: IComponentOptions = {
  controller: PageController,
  template: '<ng-include src="$ctrl.src"></ng-include>',
  bindings: {
    src: '<',
    transition: '<'
  }
};

function PageController($scope) {
  'ngInject';

  // Variables for templates
  $scope.$DIM_VERSION = $DIM_VERSION;
  $scope.$DIM_FLAVOR = $DIM_FLAVOR;
  $scope.$DIM_BUILD_DATE = new Date($DIM_BUILD_DATE).toLocaleString();

  $scope.goto = (state: string) => {
    this.transition.router.stateService.go(state);
  };
}
