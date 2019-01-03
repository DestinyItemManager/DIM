import { hot } from 'react-hot-loader';
import * as React from 'react';
import { UIRouter, UIRouterReact } from '@uirouter/react';
import { Provider } from 'react-redux';
import DragDropContext from './DragDropContext';

import App from './app/App';
import store from './app/store/store';
import makeRouter from './router.config';
import { setRouter } from './router';

class Root extends React.Component {
  router: UIRouterReact;

  constructor(props) {
    super(props);
    this.router = makeRouter();
    setRouter(this.router);
  }

  render() {
    return (
      <Provider store={store}>
        <UIRouter router={this.router}>
          <App />
        </UIRouter>
      </Provider>
    );
  }
}

export default hot(module)(DragDropContext(Root));
