import React from 'react';
import { UIView } from '@uirouter/react';
import Header from './shell/Header';
import clsx from 'clsx';
import { ActivityTracker } from './dim-ui/ActivityTracker';
import { connect } from 'react-redux';
import { RootState } from './store/reducers';
import { testFeatureCompatibility } from './compatibility';
import ClickOutsideRoot from './dim-ui/ClickOutsideRoot';
import HotkeysCheatSheet from './hotkeys/HotkeysCheatSheet';
import NotificationsContainer from './notifications/NotificationsContainer';
import styles from './App.m.scss';

interface Props {
  language: string;
  showReviews: boolean;
  itemQuality: boolean;
  showNewItems: boolean;
  charColMobile: number;
}

function mapStateToProps(state: RootState): Props {
  const settings = state.settings;
  return {
    language: settings.language,
    showReviews: settings.showReviews,
    itemQuality: settings.itemQuality,
    showNewItems: settings.showNewItems,
    charColMobile: settings.charColMobile
  };
}

class App extends React.Component<Props> {
  componentDidMount() {
    testFeatureCompatibility();
  }

  render() {
    return (
      <div
        key={`lang-${this.props.language}`}
        className={clsx(`lang-${this.props.language}`, `char-cols-${this.props.charColMobile}`, {
          'show-reviews': $featureFlags.reviewsEnabled && this.props.showReviews,
          itemQuality: this.props.itemQuality,
          'show-new-items': this.props.showNewItems,
          'ms-edge': /Edge/.test(navigator.userAgent),
          ios: /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream
        })}
      >
        <ClickOutsideRoot>
          <Header />
          <UIView />
          <NotificationsContainer />
          <ActivityTracker />
          {$featureFlags.colorA11y && <ColorA11y />}
          <HotkeysCheatSheet />
        </ClickOutsideRoot>
      </div>
    );
  }
}

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
