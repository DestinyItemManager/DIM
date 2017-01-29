function routerHelperProvider($locationProvider, $stateProvider, $urlRouterProvider) {
  'ngInject';

  /* jshint validthis:true */
  this.$get = RouterHelper;

  function RouterHelper($state) {
    'ngInject';

    var hasOtherwise = false;

    var service = {
      configureStates: configureStates,
      getStates: getStates
    };

    return service;

    function configureStates(states, otherwisePath) {
      states.forEach((state) => {
        $stateProvider.state(state.state, state.config);
      });

      if (otherwisePath && !hasOtherwise) {
        hasOtherwise = true;
        $urlRouterProvider.otherwise(otherwisePath);
      }
    }

    function getStates() {
      return $state.get();
    }
  }
}

export default routerHelperProvider;
