import React, { Suspense, useEffect } from 'react';
import Header from './shell/Header';
import clsx from 'clsx';
import ActivityTracker from './dim-ui/ActivityTracker';
import { connect } from 'react-redux';
import { RootState } from './store/reducers';
import { testFeatureCompatibility } from './compatibility';
import ClickOutsideRoot from './dim-ui/ClickOutsideRoot';
import HotkeysCheatSheet from './hotkeys/HotkeysCheatSheet';
import NotificationsContainer from './notifications/NotificationsContainer';
import styles from './App.m.scss';
import { settingsSelector } from './settings/reducer';
import { Loading } from './dim-ui/Loading';
import { Switch, Route } from 'react-router';
import DefaultAccount from './shell/DefaultAccount';
import { DestinyVersion } from '@destinyitemmanager/dim-api-types';
import Login from './login/Login';
import ScrollToTop from './shell/ScrollToTop';
import GATracker from './shell/GATracker';
import SneakyUpdates from './shell/SneakyUpdates';
import About from './shell/About';
import Destiny from './shell/Destiny';
import Privacy from './shell/Privacy';

// TODO: Could be slightly better to group these a bit, but for now we break them each into a separate chunk.
const WhatsNew = React.lazy(() =>
  import(/* webpackChunkName: "whatsnew" */ './whats-new/WhatsNew')
);
const Developer = React.lazy(() =>
  import(/* webpackChunkName: "developer" */ './developer/Developer')
);
const SettingsPage = React.lazy(() =>
  import(/* webpackChunkName: "settings" */ './settings/SettingsPage')
);
const GDriveRevisions = React.lazy(() =>
  import(/* webpackChunkName: "gdrive" */ './storage/GDriveRevisions')
);
const AuditLog = React.lazy(() => import(/* webpackChunkName: "audit" */ './settings/AuditLog'));

interface StoreProps {
  language: string;
  showReviews: boolean;
  itemQuality: boolean;
  showNewItems: boolean;
  charColMobile: number;
}

function mapStateToProps(state: RootState): StoreProps {
  const settings = settingsSelector(state);
  return {
    language: settings.language,
    showReviews: settings.showReviews,
    itemQuality: settings.itemQuality,
    showNewItems: settings.showNewItems,
    charColMobile: settings.charColMobile
  };
}

type Props = StoreProps;

function App({ language, charColMobile, showReviews, itemQuality, showNewItems }: Props) {
  useEffect(() => {
    testFeatureCompatibility();
  }, []);

  // TODO: uhhh but if we don't render the routes how will these go anywhere???
  /*
  if (!token) {
    return <Redirect login />;
  }

  if (!apikeys) {
    return <Redirect developer />;
  }
  */
  // TODO: use redux state to trigger login
  // TODO: if no account, redirect to login. if no devkeys, redirect to developer
  // TODO: some sort of <RequireAccount> wrapper that shows loading then loads account?
  // TODO: make the loading component something that adds/removes classes from a single loading component?
  //       drive a message through redux?

  return (
    <div
      key={`lang-${language}`}
      className={clsx(`lang-${language}`, `char-cols-${charColMobile}`, {
        'show-reviews': $featureFlags.reviewsEnabled && showReviews,
        itemQuality: itemQuality,
        'show-new-items': showNewItems,
        'ms-edge': /Edge/.test(navigator.userAgent),
        ios: /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream
      })}
    >
      <ScrollToTop />
      <GATracker />
      <SneakyUpdates />
      <ClickOutsideRoot>
        <Header />
        <Suspense fallback={<Loading />}>
          <Switch>
            <Route path="/about" exact>
              <About />
            </Route>
            <Route path="/privacy" exact>
              <Privacy />
            </Route>
            <Route path="/whats-new" exact>
              <WhatsNew />
            </Route>
            <Route path="/login" exact>
              <Login />
            </Route>
            <Route path="/settings/gdrive-revisions" exact>
              <GDriveRevisions />
            </Route>
            <Route path="/settings/gdrive-revisions" exact>
              <AuditLog />
            </Route>
            <Route path="/settings">
              <SettingsPage />
            </Route>
            <Route
              path="/:membershipId(\d+)/d:destinyVersion(1|2)"
              render={({ match }) => (
                <Destiny
                  destinyVersion={parseInt(match.params.destinyVersion, 10) as DestinyVersion}
                  platformMembershipId={match.params.membershipId}
                />
              )}
            />
            {$DIM_FLAVOR === 'dev' && (
              <Route path="/developer" exact>
                <Developer />
              </Route>
            )}
            <Route>
              <DefaultAccount />
            </Route>
          </Switch>
        </Suspense>
        <NotificationsContainer />
        <ActivityTracker />
        {$featureFlags.colorA11y && <ColorA11y />}
        <HotkeysCheatSheet />
      </ClickOutsideRoot>
    </div>
  );
}

/**
 * For some reason this gets messed up if it's defined in a different file.
 */
function ColorA11y() {
  if ($featureFlags.colorA11y) {
    return (
      <svg width="0" height="0" className={styles.filters}>
        <defs>
          <filter id="protanopia">
            <feColorMatrix
              type="matrix"
              values="0.567,0.433,0,0,0  0.558,0.442,0,0,0  0 0.242,0.758,0,0  0,0,0,1,0"
            />
          </filter>
          <filter id="protanomaly">
            <feColorMatrix
              type="matrix"
              values="0.817,0.183,0,0,0  0.333,0.667,0,0,0  0,0.125,0.875,0,0  0,0,0,1,0"
            />
          </filter>
          <filter id="deuteranopia">
            <feColorMatrix
              type="matrix"
              values="0.625,0.375,0,0,0  0.7,0.3,0,0,0  0,0.3,0.7,0,0  0,0,0,1,0"
            />
          </filter>
          <filter id="deuteranomaly">
            <feColorMatrix
              type="matrix"
              values="0.8,0.2,0,0,0  0.258,0.742,0,0,0  0,0.142,0.858,0,0  0,0,0,1,0"
            />
          </filter>
          <filter id="tritanopia">
            <feColorMatrix
              type="matrix"
              values="0.95,0.05,0,0,0  0,0.433,0.567,0,0  0,0.475,0.525,0,0  0,0,0,1,0"
            />
          </filter>
          <filter id="tritanomaly">
            <feColorMatrix
              type="matrix"
              values="0.967,0.033,0,0,0  0,0.733,0.267,0,0  0,0.183,0.817,0,0  0,0,0,1,0"
            />
          </filter>
          <filter id="achromatopsia">
            <feColorMatrix
              type="matrix"
              values="0.299,0.587,0.114,0,0  0.299,0.587,0.114,0,0  0.299,0.587,0.114,0,0  0,0,0,1,0"
            />
          </filter>
          <filter id="achromatomaly">
            <feColorMatrix
              type="matrix"
              values="0.618,0.320,0.062,0,0  0.163,0.775,0.062,0,0  0.163,0.320,0.516,0,0  0,0,0,1,0"
            />
          </filter>
        </defs>
      </svg>
    );
  }
  return null;
}

export default connect<StoreProps>(mapStateToProps)(App);
