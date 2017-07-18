import template from './destiny2.html';
import './destiny2.scss';

export const Destiny2Component = {
  controller: Destiny2Controller,
  template
};

function Destiny2Controller(
  dimSettingsService,
  $scope
) {
  'ngInject';

  const vm = this;

  // TODO: move these to the app scope?

  // Variables for templates that webpack does not automatically correct.
  vm.$DIM_VERSION = $DIM_VERSION;
  vm.$DIM_FLAVOR = $DIM_FLAVOR;
  vm.$DIM_CHANGELOG = $DIM_CHANGELOG;

  vm.settings = dimSettingsService;
  $scope.$watch(() => vm.settings.itemSize, (size) => {
    document.querySelector('html').style.setProperty("--item-size", `${size}px`);
  });
  $scope.$watch(() => vm.settings.charCol, (cols) => {
    document.querySelector('html').style.setProperty("--character-columns", cols);
  });
  $scope.$watch(() => vm.settings.vaultMaxCol, (cols) => {
    document.querySelector('html').style.setProperty("--vault-max-columns", cols);
  });

  vm.featureFlags = {
  };
}
