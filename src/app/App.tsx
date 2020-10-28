import { DestinyVersion } from '@destinyitemmanager/dim-api-types';
import { settingsSelector } from 'app/dim-api/selectors';
import { RootState } from 'app/store/types';
import clsx from 'clsx';
import { set } from 'idb-keyval';
import React, { Suspense, useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { Redirect, Route, Switch } from 'react-router';
import IssueBanner from './banner/IssueBanner';
import Developer from './developer/Developer';
import ActivityTracker from './dim-ui/ActivityTracker';
import ClickOutsideRoot from './dim-ui/ClickOutsideRoot';
import ErrorBoundary from './dim-ui/ErrorBoundary';
import PageLoading from './dim-ui/PageLoading';
import ShowPageLoading from './dim-ui/ShowPageLoading';
import HotkeysCheatSheet from './hotkeys/HotkeysCheatSheet';
import { t } from './i18next-t';
import Login from './login/Login';
import NotificationsContainer from './notifications/NotificationsContainer';
import About from './shell/About';
import AccountRedirectRoute from './shell/AccountRedirectRoute';
import DefaultAccount from './shell/DefaultAccount';
import Destiny from './shell/Destiny';
import ErrorPanel from './shell/ErrorPanel';
import GATracker from './shell/GATracker';
import Header from './shell/Header';
import Privacy from './shell/Privacy';
import ScrollToTop from './shell/ScrollToTop';
import SneakyUpdates from './shell/SneakyUpdates';
import { errorLog } from './utils/log';

const WhatsNew = React.lazy(
  () => import(/* webpackChunkName: "whatsNew" */ './whats-new/WhatsNew')
);

// These three are all from the same chunk
const SettingsPage = React.lazy(async () => ({
  default: (await import(/* webpackChunkName: "settings" */ './settings/components')).SettingsPage,
}));
const SearchHistory = React.lazy(
  () => import(/* webpackChunkName: "searchHistory" */ './search/SearchHistory')
);

interface StoreProps {
  language: string;
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
        errorLog('storage', 'Failed Storage Test', e);
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
        itemQuality: itemQuality,
        'show-new-items': showNewItems,
        'ms-edge': /Edge/.test(navigator.userAgent),
        ios: /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream,
        gradientBackground: $featureFlags.gradientBackground,
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
                <Route path="/settings" exact>
                  <SettingsPage />
                </Route>
                <Route path="/search-history" exact>
                  <SearchHistory />
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
                <Route
                  path={[
                    '/inventory',
                    '/progress',
                    '/records',
                    '/optimizer',
                    '/organizer',
                    '/vendors/:vendorId',
                    '/vendors',
                    '/record-books',
                    '/activities',
                  ]}
                  exact
                >
                  <AccountRedirectRoute />
                </Route>
                <Route>
                  <DefaultAccount />
                </Route>
              </Switch>
            )}
          </Suspense>
        </ErrorBoundary>
        <NotificationsContainer />
        <ActivityTracker />
        <HotkeysCheatSheet />
        {$featureFlags.issueBanner && showIssueBanner && !mobile && <IssueBanner />}
      </ClickOutsideRoot>
    </div>
  );
}

export default connect<StoreProps>(mapStateToProps)(App);
