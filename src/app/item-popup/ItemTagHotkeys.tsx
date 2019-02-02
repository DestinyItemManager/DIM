import * as React from 'react';
import { GlobalHotKeys, KeyMap } from 'react-hotkeys';
import { itemTags, TagValue } from '../inventory/dim-item-info';
import { DimItem } from '../inventory/item-types';

interface Props {
  item: DimItem;
  children: React.ReactNode;
}

const keyMap: KeyMap = {};

itemTags.forEach((tag) => {
  if (tag.hotkey) {
    keyMap['MarkItemAs_' + tag.type] = tag.hotkey;
  }
});

export default class ItemTagHotkeys extends React.Component<Props> {
  render() {
    const { item, children } = this.props;
    const handlers = {};

    itemTags.forEach((tag) => {
      if (tag.hotkey) {
        handlers['MarkItemAs_' + tag.type] = () => {
          if (item.dimInfo && item.dimInfo.tag === tag.type) {
            this.setTag('none');
          } else {
            this.setTag(tag.type!);
          }
        };
      }
    });

    // TODO: why don't these trigger?
    return (
      <GlobalHotKeys keyMap={keyMap} handlers={handlers}>
        {children}
      </GlobalHotKeys>
    );
  }

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
