import { withProfiler } from '@sentry/react';
import { MouseTransition, TouchTransition } from 'dnd-multi-backend';
import React from 'react';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { DndProvider } from 'react-dnd-multi-backend';
import { TouchBackend } from 'react-dnd-touch-backend';
import { Provider } from 'react-redux';
import { BrowserRouter as Router } from 'react-router-dom';
import App from './App';
import store from './store/store';

// Wrap App with Sentry profiling
const WrappedApp = $featureFlags.sentry ? withProfiler(App) : App;

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
          <WrappedApp />
        </DndProvider>
      </Provider>
    </Router>
  );
}

export default Root;
