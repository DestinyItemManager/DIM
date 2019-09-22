import React from 'react';
import { UIView } from '@uirouter/react';
import ManifestProgress from './ManifestProgress';
import { DestinyAccount } from '../accounts/destiny-account.service';
import ItemPopupContainer from '../item-popup/ItemPopupContainer';
import ItemPickerContainer from '../item-picker/ItemPickerContainer';
import MoveAmountPopupContainer from '../inventory/MoveAmountPopupContainer';
import { t } from 'app/i18next-t';
import GlobalHotkeys from '../hotkeys/GlobalHotkeys';
import { itemTags } from '../inventory/dim-item-info';
import { Hotkey } from '../hotkeys/hotkeys';
import { DispatchProp, connect } from 'react-redux';
import { loadCurationsFromIndexedDB } from 'app/wishlists/reducer';

interface Props extends DispatchProp {
  account: DestinyAccount;
}

/**
 * Base view for pages that show Destiny content.
 */
class Destiny extends React.Component<Props> {
  componentDidMount() {
    this.props.dispatch(loadCurationsFromIndexedDB() as any);
  }

  render() {
    // Define some hotkeys without implementation, so they show up in the help
    const hotkeys: Hotkey[] = [
      {
        combo: 't',
        description: t('Hotkey.ToggleDetails'),
        callback() {
          // Empty - this gets redefined in dimMoveItemProperties
        }
      }
    ];

    itemTags.forEach((tag) => {
      if (tag.hotkey) {
        hotkeys.push({
          combo: tag.hotkey,
          description: t('Hotkey.MarkItemAs', {
            tag: t(tag.label)
          }),
          callback() {
            // Empty - this gets redefined in item-tag.component.ts
          }
        });
      }
    });

    return (
      <>
        <div id="content">
          <UIView />
        </div>
        <GlobalHotkeys hotkeys={hotkeys} />
        <ItemPopupContainer boundarySelector=".store-header" />
        <ItemPickerContainer />
        <MoveAmountPopupContainer />
        <ManifestProgress destinyVersion={this.props.account.destinyVersion} />
      </>
    );
  }
}

export default connect()(Destiny);
