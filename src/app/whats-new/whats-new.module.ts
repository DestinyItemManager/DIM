import { module } from 'angular';

export default module('whatsNewLoader', [])
  .config(($stateProvider) => {
    'ngInject';

    $stateProvider.state({
      name: 'whats-new',
      component: 'whatsNew',
      url: '/whats-new',
      lazyLoad($transition$) {
        const $ocLazyLoad = $transition$.injector().get('$ocLazyLoad');
        // tslint:disable-next-line:space-in-parens
        return import(/* webpackChunkName: "whats-new" */ './whats-new.lazy')
          .then((mod) => {
            return $ocLazyLoad.load(mod.default);
          });
      }
    });
  })
  .name;
