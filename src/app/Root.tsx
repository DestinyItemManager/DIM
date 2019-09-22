import { hot } from 'react-hot-loader/root';
import React from 'react';
import { UIRouter, UIRouterReact } from '@uirouter/react';
import { Provider } from 'react-redux';
import HTML5Backend from 'react-dnd-html5-backend';

import App from './App';
import store from './store/store';
import makeRouter from './router.config';
import { setRouter } from './router';
import { DndProvider } from 'react-dnd';

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
        <DndProvider backend={HTML5Backend}>
          <UIRouter router={this.router}>
            <App />
          </UIRouter>
        </DndProvider>
      </Provider>
    );
  }
}

export default hot(Root);
