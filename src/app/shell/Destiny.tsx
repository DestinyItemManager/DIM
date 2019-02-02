import * as React from 'react';
import { UIView } from '@uirouter/react';
import ManifestProgress from './ManifestProgress';
import { DestinyAccount } from '../accounts/destiny-account.service';
import ItemPopupContainer from '../item-popup/ItemPopupContainer';
import ItemPickerContainer from '../item-picker/ItemPickerContainer';
import MoveAmountPopupContainer from '../inventory/MoveAmountPopupContainer';

interface Props {
  account: DestinyAccount;
}

/**
 * Base view for pages that show Destiny content.
 */
export default class Destiny extends React.Component<Props> {
  render() {
    return (
      <>
        <div className="store-bounds" />
        <div id="content">
          <UIView />
        </div>
        <ItemPopupContainer boundarySelector=".store-bounds" />
        <ItemPickerContainer />
        <MoveAmountPopupContainer />
        <ManifestProgress destinyVersion={this.props.account.destinyVersion} />
      </>
    );
  }
}
