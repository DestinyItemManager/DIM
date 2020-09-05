import { MouseTransition, TouchTransition } from 'dnd-multi-backend';
import React from 'react';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { DndProvider } from 'react-dnd-multi-backend';
import { TouchBackend } from 'react-dnd-touch-backend';
import { hot } from 'react-hot-loader/root';
import { Provider } from 'react-redux';
import { BrowserRouter as Router } from 'react-router-dom';
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
