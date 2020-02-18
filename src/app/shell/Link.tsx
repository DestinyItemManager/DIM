import React, { useEffect, useState } from 'react';
import styles from './Link.m.scss';
import { DestinyAccount } from '../accounts/destiny-account';
import { UISrefActive, UISref } from '@uirouter/react';
import { router } from '../router';

export default function Link({
  state,
  account,
  children,
  text,
  showWhatsNew
}: {
  account?: DestinyAccount;
  state: string;
  text?: string;
  children?: React.ReactChild;
  showWhatsNew?: boolean;
}) {
  // This should be a really simple component, but because of https://github.com/ui-router/react/issues/204
  // it can't handle lazy states, and we need to use "key" to nuke the whole component tree on updates.
  const [generation, setGeneration] = useState(0);
  useEffect(() => router.stateRegistry.onStatesChanged(() => setGeneration((g) => g + 1)), []);

  return (
    <UISrefActive key={generation} class="active">
      <UISref to={state} params={account}>
        <a className="link">
          {showWhatsNew && <span className={styles.badgeNew} />}
          {children}
          {text}
        </a>
      </UISref>
    </UISrefActive>
  );
}
