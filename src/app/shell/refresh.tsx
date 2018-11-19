import * as React from 'react';
import { hotkeys } from '../ngimport-more';
import { t } from 'i18next';
import { Subscription } from 'rxjs/Subscription';
import { AppIcon, refreshIcon } from './icons';
import { Subject } from 'rxjs/Subject';
import { loadingTracker } from './loading-tracker';

export const refresh$ = new Subject();

export function refresh() {
  // Individual pages should listen to this event and decide what to refresh,
  // and their services should decide how to cache/dedup refreshes.
  // This event should *NOT* be listened to by services!
  refresh$.next();
}

export default class Refresh extends React.Component<{}, { active: boolean }> {
  private subscription: Subscription;

  constructor(props) {
    super(props);
    this.state = { active: false };
  }

  componentDidMount() {
    hotkeys.add({
      combo: ['r'],
      description: t('Hotkey.RefreshInventory'),
      callback: refresh
    });

    this.subscription = loadingTracker.active$.subscribe((active) => {
      this.setState({ active });
    });
  }

  componentWillUnmount() {
    hotkeys.del('r');
    this.subscription.unsubscribe();
  }

  render() {
    const { active } = this.state;

    return (
      <span className="link" onClick={refresh} title={t('Header.Refresh')}>
        <AppIcon icon={refreshIcon} spinning={active} />
      </span>
    );
  }
}
