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
import routes from './routes';
import Privacy from './shell/Privacy';
import WhatsNew from './whats-new/WhatsNew';
import Developer from './developer/Developer';
import SettingsPage from './settings/SettingsPage';
import Destiny from './shell/Destiny';
import GDriveRevisions from './storage/GDriveRevisions';
import AuditLog from './settings/AuditLog';
import DefaultAccount from './shell/DefaultAccount';

// TODO: may not be worth it to load this lazy!
const About = React.lazy(() => import(/* webpackChunkName: "about" */ './shell/About'));

interface Props {
  language: string;
  showReviews: boolean;
  itemQuality: boolean;
  showNewItems: boolean;
  charColMobile: number;
}

function mapStateToProps(state: RootState): Props {
  const settings = settingsSelector(state);
  return {
    language: settings.language,
    showReviews: settings.showReviews,
    itemQuality: settings.itemQuality,
    showNewItems: settings.showNewItems,
    charColMobile: settings.charColMobile
  };
}

function App({ language, charColMobile, showReviews, itemQuality, showNewItems }: Props) {
  useEffect(() => {
    testFeatureCompatibility();
  }, []);

  // TODO: uhhh but if we don't render the routes how will these go anywhere???
  if (!token) {
    return <Redirect login />;
  }

  if (!apikeys) {
    return <Redirect developer />;
  }

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
      <ClickOutsideRoot>
        <Header />
        <Suspense fallback={<Loading />}>
          <Switch>
            <Route path={routes.about()} exact>
              <About />
            </Route>
            <Route path={routes.privacy()} exact>
              <Privacy />
            </Route>
            <Route path={routes.whatsNew()} exact>
              <WhatsNew />
            </Route>
            <Route path={routes.login()} exact>
              <WhatsNew />
            </Route>
            {/* TODO: sub-switch? */}
            <Route path={routes.settings.gdriveRevisions()} exact>
              <GDriveRevisions />
            </Route>
            <Route path={routes.settings.auditLog()} exact>
              <AuditLog />
            </Route>
            <Route path={routes.settings()}>
              <SettingsPage />
            </Route>
            <Route
              path={[routes.d1(':platformMembershipId'), routes.d2(':platformMembershipId')]}
              render={({ match }) => (
                <Destiny
                  destinyVersion={match.path.endsWith('d2') ? 2 : 1}
                  platformMembershipId={match.params.platformMembershipId}
                />
              )}
            />
            {$DIM_FLAVOR === 'dev' && (
              <Route path={routes.developer()} exact>
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

export default connect<Props>(mapStateToProps)(App);
