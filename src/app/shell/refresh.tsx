import * as React from 'react';
import { hotkeys } from '../ngimport-more';
import { $rootScope } from 'ngimport';
import { t } from 'i18next';
import classNames from 'classnames';
import { loadingTrackerStream } from './dimLoadingTracker.factory';
import { Subscription } from 'rxjs/Subscription';

export default class Refresh extends React.Component<{}, { active: boolean }> {
  private subscription: Subscription;

  constructor(props) {
    super(props);
    this.state = { active: false };

    hotkeys.add({
      combo: ['r'],
      description: t('Hotkey.RefreshInventory'),
      callback: () => {
        this.refresh();
      }
    });
  }

  componentDidMount() {
    this.subscription = loadingTrackerStream.subscribe((active) => {
      this.setState({ active });
    });
  }

  componentWillUnmount() {
    hotkeys.remove('r');
    this.subscription.unsubscribe();
  }

  render() {
    const { active } = this.state;

    return (
      <span className="link" onClick={this.refresh} title={t('Header.Refresh')}>
        <i className={classNames('fa', 'fa-refresh', { 'fa-spin': active })}/>
      </span>
    );
  }

  private refresh = () => {
    // Individual pages should listen to this event and decide what to refresh,
    // and their services should decide how to cache/dedup refreshes.
    // This event should *NOT* be listened to by services!
    $rootScope.$broadcast('dim-refresh');
  }
}
