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

import { getPlatforms, getActivePlatform } from 'app/accounts/platforms';
import { getDefinitions as getD2Definitions } from 'app/destiny2/d2-definitions';
import { getDefinitions as getD1Definitions } from 'app/destiny1/d1-definitions';

class Root extends React.Component {
  router: UIRouterReact;

  constructor(props) {
    super(props);
    this.router = makeRouter();
    setRouter(this.router);

    (async () => {
      await getPlatforms();
      const activePlatform = getActivePlatform();
      if (activePlatform) {
        if (activePlatform.destinyVersion === 2) {
          return getD2Definitions();
        } else {
          return getD1Definitions();
        }
      }
    })();
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
