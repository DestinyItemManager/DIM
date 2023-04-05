import { withProfiler } from '@sentry/react';
import { LocationSwitcher } from 'app/shell/LocationSwitcher';
import { HTML5Backend } from 'react-dnd-html5-backend';
import {
  DndProvider,
  MouseTransition,
  MultiBackendOptions,
  TouchTransition,
} from 'react-dnd-multi-backend';
import { TouchBackend } from 'react-dnd-touch-backend';
import { Provider } from 'react-redux';
import { BrowserRouter as Router } from 'react-router-dom';
import App from './App';
import store from './store/store';

// Wrap App with Sentry profiling
const WrappedApp = $featureFlags.sentry ? withProfiler(App) : App;

function Root() {
  const options: MultiBackendOptions = {
    backends: [
      { id: 'html5', backend: HTML5Backend, transition: MouseTransition },
      // We can drop this after we only support iOS 15+ and Chrome 108+
      {
        id: 'touch',
        backend: TouchBackend,
        transition: TouchTransition,
        options: { delayTouchStart: 150 },
      },
    ],
  };
  return (
    <Router>
      <Provider store={store}>
        <LocationSwitcher />
        <DndProvider options={options}>
          <WrappedApp />
        </DndProvider>
      </Provider>
    </Router>
  );
}

export default Root;
