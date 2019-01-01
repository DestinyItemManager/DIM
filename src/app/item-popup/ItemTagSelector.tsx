import * as React from 'react';
import { itemTags, TagValue, getTag } from '../inventory/dim-item-info';
import { t } from 'i18next';
import { connect } from 'react-redux';
import { DimItem } from '../inventory/item-types';
import { RootState } from '../store/reducers';
import './ItemTagSelector.scss';
import { $rootScope } from 'ngimport';
import { hotkeys } from '../ngimport-more';

interface ProvidedProps {
  item: DimItem;
}

interface StoreProps {
  tag?: TagValue;
}

function mapStateToProps(state: RootState, props: ProvidedProps): StoreProps {
  return { tag: getTag(props.item, state.inventory.itemInfos) };
}

type Props = ProvidedProps & StoreProps;

class ItemTagSelector extends React.Component<Props> {
  private $scope = $rootScope.$new(true);

  componentDidMount() {
    const hot = hotkeys.bindTo(this.$scope);
    itemTags.forEach((tag) => {
      if (tag.hotkey) {
        hot.add({
          combo: [tag.hotkey],
          description: t('Hotkey.MarkItemAs', {
            tag: t(tag.label)
          }),
          callback: () => {
            if (this.props.item.dimInfo && this.props.item.dimInfo.tag === tag.type) {
              this.setTag('none');
            } else {
              this.setTag(tag.type!);
            }
          }
        });
      }
    });
  }

  componentWillUnmount() {
    this.$scope.$destroy();
  }

  render() {
    const { tag } = this.props;

    return (
      <select className="item-tag-selector" onChange={this.onTagUpdated} value={tag || 'none'}>
        {itemTags.map((tagOption) => (
          <option key={tagOption.type || 'reset'} value={tagOption.type || 'none'}>
            {t(tagOption.label)}
          </option>
        ))}
      </select>
    );
  }

  private onTagUpdated = (e) => {
    const tag = e.currentTarget.value as TagValue;
    this.setTag(tag);
  };

  private setTag = (tag?: TagValue | 'none') => {
    const info = this.props.item.dimInfo;
    if (info) {
      if (tag && tag !== 'none') {
        info.tag = tag;
      } else {
        delete info.tag;
      }
      info.save!();
    }
  };
}

export default connect<StoreProps>(mapStateToProps)(ItemTagSelector);
