import { ICompileProvider } from 'angular';

export default function config($compileProvider: ICompileProvider) {
  'ngInject';

  $compileProvider.imgSrcSanitizationWhitelist(/^\s*(https?:|data:image\/)/);
}
