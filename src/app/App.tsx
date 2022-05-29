import { settingSelector } from 'app/dim-api/selectors';
import { RootState } from 'app/store/types';
import clsx from 'clsx';
import React, { Suspense } from 'react';
import { useSelector } from 'react-redux';
import { Navigate, Route, Routes } from 'react-router';
import styles from './App.m.scss';
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
import GATracker from './shell/GATracker';
import Header from './shell/Header';
import Privacy from './shell/Privacy';
import ScrollToTop from './shell/ScrollToTop';
import SneakyUpdates from './shell/SneakyUpdates';

const WhatsNew = React.lazy(
  () => import(/* webpackChunkName: "whatsNew" */ './whats-new/WhatsNew')
);
const SettingsPage = React.lazy(
  () => import(/* webpackChunkName: "settings" */ './settings/SettingsPage')
);
const SearchHistory = React.lazy(
  () => import(/* webpackChunkName: "searchHistory" */ './search/SearchHistory')
);

export default function App() {
  const language = useSelector(settingSelector('language'));
  const itemQuality = useSelector(settingSelector('itemQuality'));
  const charColMobile = useSelector(settingSelector('charColMobile'));
  const needsLogin = useSelector((state: RootState) => state.accounts.needsLogin);
  const needsDeveloper = useSelector((state: RootState) => state.accounts.needsDeveloper);

  return (
    <div
      key={`lang-${language}`}
      className={clsx(styles.app, `lang-${language}`, `char-cols-${charColMobile}`, {
        itemQuality,
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
            <Routes>
              <Route path="about" element={<About />} />
              <Route path="privacy" element={<Privacy />} />
              <Route path="whats-new" element={<WhatsNew />} />
              <Route path="login" element={<Login />} />
              <Route path="settings" element={<SettingsPage />} />
              {$DIM_FLAVOR === 'dev' && <Route path="developer" element={<Developer />} />}
              {needsLogin ? (
                <Route
                  path="*"
                  element={
                    $DIM_FLAVOR === 'dev' && needsDeveloper ? (
                      <Navigate to="/developer" />
                    ) : (
                      <Navigate to="/login" />
                    )
                  }
                />
              ) : (
                <>
                  <Route path="search-history" element={<SearchHistory />} />
                  <Route path=":membershipId/d:destinyVersion/*" element={<Destiny />} />
                  {[
                    'inventory',
                    'progress',
                    'records',
                    'optimizer',
                    'loadouts',
                    'organizer',
                    'vendors/:vendorId',
                    'vendors',
                    'record-books',
                    'activities',
                    'armory/:itemHash',
                  ].map((path) => (
                    <Route key={path} path={path} element={<AccountRedirectRoute />} />
                  ))}
                  <Route
                    path="*"
                    element={
                      needsLogin ? (
                        $DIM_FLAVOR === 'dev' && needsDeveloper ? (
                          <Navigate to="developer" />
                        ) : (
                          <Navigate to="login" />
                        )
                      ) : (
                        <DefaultAccount />
                      )
                    }
                  />
                </>
              )}
            </Routes>
          </Suspense>
        </ErrorBoundary>
        <NotificationsContainer />
        <ActivityTracker />
        <HotkeysCheatSheet />
      </ClickOutsideRoot>
    </div>
  );
}
