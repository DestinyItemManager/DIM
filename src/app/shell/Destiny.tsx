import * as React from 'react';
import { UIView } from '@uirouter/react';
import ManifestProgress from './ManifestProgress';
import { $rootScope } from 'ngimport';
import { hotkeys } from '../ngimport-more';
import { t } from 'i18next';
import { DestinyAccount } from '../accounts/destiny-account.service';
import { itemTags } from '../inventory/dim-item-info';
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
  private $scope = $rootScope.$new(true);

  componentDidMount() {
    const hot = hotkeys.bindTo(this.$scope);

    // Define some hotkeys without implementation, so they show up in the help
    hot.add({
      combo: ['i'],
      description: t('Hotkey.ToggleDetails'),
      callback() {
        // Empty - this gets redefined in dimMoveItemProperties
      }
    });
    itemTags.forEach((tag) => {
      if (tag.hotkey) {
        hot.add({
          combo: [tag.hotkey],
          description: t('Hotkey.MarkItemAs', {
            tag: t(tag.label)
          }),
          callback() {
            // Empty - this gets redefined in item-tag.component.ts
          }
        });
      }
    });
  }

  componentWillUnmount() {
    this.$scope.$destroy();
  }

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
