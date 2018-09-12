/**
 * Angular2react needs an $injector, but it doesn't actually invoke $injector.get
 * until we invoke ReactDOM.render. We can take advantage of this to provide the
 * "lazy" injector below to React components created with angular2react, as a way
 * to avoid component ordering issues.
 *
 * @see https://github.com/coatue-oss/angular2react/issues/12
 */

// state
let $injector;

export let lazyInjector = {
  get $injector() {
    return {
      get get() {
        return $injector.get;
      }
    };
  },
  set $injector(_$injector) {
    $injector = _$injector;
  }
};
