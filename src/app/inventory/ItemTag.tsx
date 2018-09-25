import * as React from 'react';
import './ItemTag.scss';
import classNames from 'classnames';
import { TagValue, itemTags } from './dim-item-info';

interface Props {
  tag?: TagValue;
}

const iconType = {};
itemTags.forEach((tag) => {
  if (tag.type) {
    iconType[tag.type] = tag.icon;
  }
});

export default class ItemTag extends React.Component<Props> {
  render() {
    const { tag } = this.props;

    if (tag !== undefined) {
      return (
        <div className="tag">
          <i className={classNames('item-tag fa', 'fa-' + iconType[tag])} />
        </div>
      );
    } else {
      return null;
    }
  }
}
