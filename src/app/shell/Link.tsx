import * as React from 'react';
import { DestinyAccount } from '../accounts/destiny-account.service';
import { t } from 'i18next';
import { UISrefActive, UISref } from '@uirouter/react';

export default function Link({
  account,
  state,
  text,
  children
}: {
  account?: DestinyAccount;
  state: string;
  text?: string;
  children?: React.ReactChild;
}) {
  return (
    <UISrefActive class='active'>
      <UISref to={state} params={account}>
        <a className='link'>{children}{text && t(text)}</a>
      </UISref>
    </UISrefActive>
  );
}
