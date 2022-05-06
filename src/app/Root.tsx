import { withProfiler } from '@sentry/react';
import React from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import MultiBackend, { Backends, MouseTransition, TouchTransition } from 'react-dnd-multi-backend';
import { TouchBackend } from 'react-dnd-touch-backend';
import { Provider } from 'react-redux';
import { BrowserRouter as Router } from 'react-router-dom';
import App from './App';
import store from './store/store';

// Wrap App with Sentry profiling
const WrappedApp = $featureFlags.sentry ? withProfiler(App) : App;

function Root() {
  const options: Backends = {
    backends: [
      { backend: HTML5Backend as any, transition: MouseTransition },
      {
        backend: TouchBackend as any,
        transition: TouchTransition,
        options: { delayTouchStart: 150 },
      },
    ],
  };
  return (
    <Router>
      <Provider store={store}>
        <DndProvider backend={MultiBackend as any} options={options}>
          <WrappedApp />
        </DndProvider>
      </Provider>
    </Router>
  );
}

export default Root;
