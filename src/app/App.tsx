import React, { Suspense, useEffect, useState } from 'react';
import Header from './shell/Header';
import clsx from 'clsx';
import ActivityTracker from './dim-ui/ActivityTracker';
import { connect } from 'react-redux';
import { RootState } from 'app/store/types';
import ClickOutsideRoot from './dim-ui/ClickOutsideRoot';
import HotkeysCheatSheet from './hotkeys/HotkeysCheatSheet';
import NotificationsContainer from './notifications/NotificationsContainer';
import styles from './App.m.scss';
import { settingsSelector } from './settings/reducer';
import { Switch, Route, Redirect } from 'react-router';
import DefaultAccount from './shell/DefaultAccount';
import { DestinyVersion } from '@destinyitemmanager/dim-api-types';
import Login from './login/Login';
import ScrollToTop from './shell/ScrollToTop';
import GATracker from './shell/GATracker';
import SneakyUpdates from './shell/SneakyUpdates';
import About from './shell/About';
import Destiny from './shell/Destiny';
import Privacy from './shell/Privacy';
import Developer from './developer/Developer';
import ErrorBoundary from './dim-ui/ErrorBoundary';
import PageLoading from './dim-ui/PageLoading';
import ShowPageLoading from './dim-ui/ShowPageLoading';
import { t } from './i18next-t';
import { IssueBanner } from './banner/IssueBanner';
import { set } from 'idb-keyval';
import ErrorPanel from './shell/ErrorPanel';

const WhatsNew = React.lazy(() =>
  import(/* webpackChunkName: "whatsNew" */ './whats-new/WhatsNew')
);

// These three are all from the same chunk
const SettingsPage = React.lazy(async () => ({
  default: (await import(/* webpackChunkName: "settings" */ './settings/components')).SettingsPage,
}));
const AuditLog = React.lazy(async () => ({
  default: (await import(/* webpackChunkName: "settings" */ './settings/components')).AuditLog,
}));

interface StoreProps {
  language: string;
  showReviews: boolean;
  itemQuality: boolean;
  showNewItems: boolean;
  charColMobile: number;
  needsLogin: boolean;
  reauth: boolean;
  needsDeveloper: boolean;
  showIssueBanner: boolean;
}

function mapStateToProps(state: RootState): StoreProps {
  const settings = settingsSelector(state);
  return {
    language: settings.language,
    showReviews: settings.showReviews,
    itemQuality: settings.itemQuality,
    showNewItems: settings.showNewItems,
    charColMobile: settings.charColMobile,
    needsLogin: state.accounts.needsLogin,
    reauth: state.accounts.reauth,
    needsDeveloper: state.accounts.needsDeveloper,
    showIssueBanner: $featureFlags.issueBanner && state.dimApi.globalSettings.showIssueBanner,
  };
}

type Props = StoreProps;

const mobile = /iPad|iPhone|iPod|Android/.test(navigator.userAgent);

function App({
  language,
  charColMobile,
  showReviews,
  itemQuality,
  showNewItems,
  needsLogin,
  reauth,
  needsDeveloper,
  showIssueBanner,
}: Props) {
  const [storageWorks, setStorageWorks] = useState(true);
  useEffect(() => {
    (async () => {
      try {
        localStorage.setItem('test', 'true');
        if (!window.indexedDB) {
          throw new Error('IndexedDB not available');
        }
        await set('idb-test', true);
      } catch (e) {
        console.error('Failed Storage Test', e);
        setStorageWorks(false);
      }
    })();
  }, []);

  if (!storageWorks) {
    return (
      <div className="dim-page">
        <ErrorPanel
          title={t('Help.NoStorage')}
          fallbackMessage={t('Help.NoStorageMessage')}
          showTwitters={true}
        />
      </div>
    );
  }

  return (
    <div
      key={`lang-${language}`}
      className={clsx(`lang-${language}`, `char-cols-${charColMobile}`, {
        'show-reviews': $featureFlags.reviewsEnabled && showReviews,
        itemQuality: itemQuality,
        'show-new-items': showNewItems,
        'ms-edge': /Edge/.test(navigator.userAgent),
        ios: /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream,
      })}
    >
      <ScrollToTop />
      <GATracker />
      <SneakyUpdates />
      <ClickOutsideRoot>
        <Header />
        <PageLoading />
        <ErrorBoundary name="DIM Code">
          <Suspense fallback={<ShowPageLoading message={t('Loading.Code')} />}>
            {/* In the force-login or force-developer cases, the app can only navigate to /login or /developer */}
            {$DIM_FLAVOR === 'dev' && needsDeveloper ? (
              <Switch>
                <Route path="/developer" exact>
                  <Developer />
                </Route>
                <Route>
                  <Redirect to={'/developer'} />
                </Route>
              </Switch>
            ) : needsLogin ? (
              <Switch>
                <Route path="/login" exact>
                  <Login />
                </Route>
                <Route>
                  <Redirect to={reauth ? '/login?reauth=true' : '/login'} />
                </Route>
              </Switch>
            ) : (
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
                <Route path="/settings/audit" exact>
                  <AuditLog />
                </Route>
                <Route path="/settings" exact>
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
            )}
          </Suspense>
        </ErrorBoundary>
        <NotificationsContainer />
        <ActivityTracker />
        {$featureFlags.colorA11y && <ColorA11y />}
        <HotkeysCheatSheet />
        {$featureFlags.issueBanner && showIssueBanner && !mobile && <IssueBanner />}
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
