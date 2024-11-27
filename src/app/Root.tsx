import { withProfiler } from '@sentry/react';
import { LocationSwitcher } from 'app/shell/LocationSwitcher';
import { HTML5Backend } from 'react-dnd-html5-backend';
import {
  DndProvider,
  MultiBackendOptions,
  PointerTransition,
  TouchTransition,
} from 'react-dnd-multi-backend';
import { TouchBackend } from 'react-dnd-touch-backend';
import { Provider } from 'react-redux';
import { BrowserRouter as Router } from 'react-router';
import App from './App';
import store from './store/store';
import { isNativeDragAndDropSupported } from './utils/browsers';

// Wrap App with Sentry profiling
const ProfiledApp = withProfiler(App);

function Root() {
  const options: MultiBackendOptions = {
    backends:
      // If we have native DnD then use it. iOS 15+ supports both touch and
      // native dnd, and without this it'd switch to touch.
      isNativeDragAndDropSupported()
        ? [{ id: 'html5', backend: HTML5Backend }]
        : [
            { id: 'html5', backend: HTML5Backend, transition: PointerTransition },
            // We can drop this after we only support iOS 15+ and Chrome 108+
            {
              id: 'touch',
              backend: TouchBackend,
              options: { enableMouseEvents: true, delayTouchStart: 150 },
              preview: true,
              transition: TouchTransition,
            },
          ],
  };
  return (
    <Router basename={$PUBLIC_PATH}>
      <Provider store={store}>
        <LocationSwitcher />
        <DndProvider options={options}>
          <ProfiledApp />
        </DndProvider>
      </Provider>
    </Router>
  );
}

export default Root;
