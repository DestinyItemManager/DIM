import * as React from 'react';
import { itemTags, TagValue, getTag } from '../inventory/dim-item-info';
import { t } from 'i18next';
import { connect } from 'react-redux';
import { DimItem } from '../inventory/item-types';
import { RootState } from '../store/reducers';
import './item-tag.scss';

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
  render() {
    const { tag } = this.props;

    return (
      <select className="item-tag-selector" onChange={this.onTagUpdated} value={tag}>
        {itemTags.map((tagOption) => (
          <option key={tagOption.type || 'reset'} value={tagOption.type}>
            {t(tagOption.label)}
          </option>
        ))}
      </select>
    );
  }

  private onTagUpdated = (e) => {
    const tag = e.currentTarget.value as TagValue;
    const info = this.props.item.dimInfo;
    if (info) {
      if (tag) {
        info.tag = tag;
      } else {
        delete info.tag;
      }
      info.save!();
    }
  };
}

export default connect<StoreProps>(mapStateToProps)(ItemTagSelector);
