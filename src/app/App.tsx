import { DestinyVersion } from '@destinyitemmanager/dim-api-types';
import { settingsSelector } from 'app/dim-api/selectors';
import { RootState } from 'app/store/types';
import clsx from 'clsx';
import { set } from 'idb-keyval';
import React, { Suspense, useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { Redirect, Route, Switch } from 'react-router';
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
  };
}

type Props = StoreProps;

function App({
  language,
  charColMobile,
  itemQuality,
  showNewItems,
  needsLogin,
  reauth,
  needsDeveloper,
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
      className={clsx('app', `lang-${language}`, `char-cols-${charColMobile}`, {
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
            <Switch>
              <Route path="/about" component={About} exact />
              <Route path="/privacy" component={Privacy} exact />
              <Route path="/whats-new" component={WhatsNew} exact />
              <Route path="/login" component={Login} exact />
              <Route path="/settings" component={SettingsPage} exact />
              {$DIM_FLAVOR === 'dev' && <Route path="/developer" component={Developer} exact />}
              {needsLogin ? (
                $DIM_FLAVOR === 'dev' && needsDeveloper ? (
                  <Redirect to={'/developer'} />
                ) : (
                  <Redirect to={reauth ? '/login?reauth=true' : '/login'} />
                )
              ) : (
                <>
                  <Route path="/search-history" component={SearchHistory} exact />
                  <Route
                    path="/:membershipId(\d+)/d:destinyVersion(1|2)"
                    render={({ match }) => (
                      <Destiny
                        destinyVersion={parseInt(match.params.destinyVersion, 10) as DestinyVersion}
                        platformMembershipId={match.params.membershipId}
                      />
                    )}
                  />
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
                </>
              )}
            </Switch>
          </Suspense>
        </ErrorBoundary>
        <NotificationsContainer />
        <ActivityTracker />
        <HotkeysCheatSheet />
      </ClickOutsideRoot>
    </div>
  );
}

export default connect<StoreProps>(mapStateToProps)(App);
