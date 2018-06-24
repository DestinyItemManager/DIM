import * as React from 'react';
import { UIView } from "@uirouter/react";
import ManifestProgress from '../shell/ManifestProgress';
import { $rootScope } from 'ngimport';
import { hotkeys } from '../ngimport-more';
import { t } from 'i18next';
import { itemTags } from '../settings/settings';
import './destiny2.scss';

export default class Destiny2 extends React.Component {
  private $scope = $rootScope.$new(true);

  componentDidMount() {
    const hot = hotkeys.bindTo(this.$scope);

    hot.add({
      combo: ['i'],
      description: t('Hotkey.ToggleDetails'),
      callback() {
        $rootScope.$broadcast('dim-toggle-item-details');
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
            $rootScope.$broadcast('dim-item-tag', { tag: tag.type });
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
        <div id="content">
          <UIView/>
        </div>
        <div className="store-bounds"/>
        <ManifestProgress destinyVersion={2} />
      </>
    );
  }
}
