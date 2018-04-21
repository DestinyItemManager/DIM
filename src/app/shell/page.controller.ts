import './page.scss';

export default function PageController($scope) {
  'ngInject';

  // Variables for templates
  $scope.$DIM_VERSION = $DIM_VERSION;
  $scope.$DIM_FLAVOR = $DIM_FLAVOR;
  $scope.$DIM_BUILD_DATE = new Date($DIM_BUILD_DATE).toLocaleString();
}
