export function compiler($compileProvider) {
  "ngInject";

  // TODO: remove this depenency by fixing component bindings https://github.com/angular/angular.js/blob/master/CHANGELOG.md#breaking-changes-1
  $compileProvider.preAssignBindingsEnabled(true);
  // Allow chrome-extension: URLs in ng-src
  $compileProvider.imgSrcSanitizationWhitelist(/^\s*((https?|chrome-extension):|data:image\/)/);
}
