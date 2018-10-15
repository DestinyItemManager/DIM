import * as React from 'react';
import './ItemTag.scss';
import { TagValue, itemTags } from './dim-item-info';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { AppIcon } from '../shell/icons';

interface Props {
  tag?: TagValue;
}

const iconType: { [k: string]: IconDefinition } = {};
itemTags.forEach((tag) => {
  if (tag.type && tag.icon) {
    iconType[tag.type] = tag.icon;
  }
});

export default class ItemTag extends React.Component<Props> {
  render() {
    const { tag } = this.props;

    if (tag !== undefined) {
      return (
        <div className="tag">
          <AppIcon className="item-tag" icon={iconType[tag]} />
        </div>
      );
    } else {
      return null;
    }
  }
}
