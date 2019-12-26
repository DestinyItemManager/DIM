import React from 'react';
import { itemTagList, TagValue } from '../inventory/dim-item-info';
import { DimItem } from '../inventory/item-types';
import { Hotkey } from '../hotkeys/hotkeys';
import GlobalHotkeys from '../hotkeys/GlobalHotkeys';
import { t } from 'app/i18next-t';

interface Props {
  item: DimItem;
  children: React.ReactNode;
}

export default class ItemTagHotkeys extends React.Component<Props> {
  render() {
    const { item, children } = this.props;
    if (!item.taggable) {
      return children;
    }

    const hotkeys: Hotkey[] = [];

    itemTagList.forEach((tag) => {
      if (tag.hotkey) {
        hotkeys.push({
          combo: tag.hotkey,
          description: t('Hotkey.MarkItemAs', { tag: tag.type }),
          callback: () => {
            if (item.dimInfo?.tag === tag.type) {
              this.setTag('none');
            } else {
              this.setTag(tag.type);
            }
          }
        });
      }
    });

    return (
      <GlobalHotkeys key={item.id} hotkeys={hotkeys}>
        {children}
      </GlobalHotkeys>
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
