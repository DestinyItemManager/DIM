const routes = function($stateProvider) {
  'ngInject';

  const states = [{
    name: 'shell',
    parent: 'root',
    abstract: true,
    component: 'dimShell'
  }];

  states.forEach((state) => {
    $stateProvider.state(state);
  });
};

export default routes;