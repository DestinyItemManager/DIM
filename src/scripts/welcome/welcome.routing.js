const routing = ($stateProvider) => {
  'ngInject';

  const states = [{
    name: 'welcome',
    parent: 'content',
    component: 'welcome',
    url: '/welcome'
  }];

  states.forEach((state) => {
    $stateProvider.state(state);
  });
}

export default routing;
