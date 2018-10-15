import * as React from 'react';
import { itemTags, TagValue } from '../inventory/dim-item-info';
import { t } from 'i18next';

interface Props {
  tag?: TagValue;
  onTagUpdated(tag?: TagValue);
}

export default class ItemTagSelector extends React.Component<Props> {
  render() {
    const { tag, onTagUpdated } = this.props;

    return (
      <select
        className="item-tag"
        onChange={(e) => onTagUpdated(e.currentTarget.value as TagValue)}
        value={tag}
      >
        {itemTags.map((tagOption) => (
          <option key={tagOption.type || 'reset'} value={tagOption.type}>
            {t(tagOption.label)}
          </option>
        ))}
      </select>
    );
  }
}
