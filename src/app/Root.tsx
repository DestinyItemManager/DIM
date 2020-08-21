import { hot } from 'react-hot-loader/root';
import React from 'react';
import { Provider } from 'react-redux';
import { DndProvider } from 'react-dnd-multi-backend';
import { BrowserRouter as Router } from 'react-router-dom';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TouchBackend } from 'react-dnd-touch-backend';
import { TouchTransition, MouseTransition } from 'dnd-multi-backend';

import App from './App';
import store from './store/store';

function Root() {
  const options = {
    backends: [
      { backend: HTML5Backend, transition: MouseTransition },
      { backend: TouchBackend, transition: TouchTransition, options: { delayTouchStart: 150 } },
    ],
  };
  return (
    <Router>
      <Provider store={store}>
        <DndProvider options={options}>
          <App />
        </DndProvider>
      </Provider>
    </Router>
  );
}

export default hot(Root);
