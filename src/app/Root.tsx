import { hot } from 'react-hot-loader/root';
import React from 'react';
import { Provider } from 'react-redux';
import HTML5Backend from 'react-dnd-html5-backend';

import App from './App';
import store from './store/store';
import { DndProvider } from 'react-dnd';
import { BrowserRouter as Router } from 'react-router-dom';

function Root() {
  return (
    <Router>
      <Provider store={store}>
        <DndProvider backend={HTML5Backend}>
          <App />
        </DndProvider>
      </Provider>
    </Router>
  );
}

export default hot(Root);
