import KeyHelp from 'app/dim-ui/KeyHelp';
import Select, { Option } from 'app/dim-ui/Select';
import { t, tl } from 'app/i18next-t';
import { setItemHashTag, setItemTag } from 'app/inventory/actions';
import { itemTagSelectorList, TagInfo, TagValue } from 'app/inventory/dim-item-info';
import { DimItem } from 'app/inventory/item-types';
import { tagSelector } from 'app/inventory/selectors';
import { AppIcon, clearIcon } from 'app/shell/icons';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import { itemIsInstanced } from 'app/utils/item-utils';
import clsx from 'clsx';
import _ from 'lodash';
import React from 'react';
import { useSelector } from 'react-redux';
import styles from './ItemTagSelector.m.scss';

interface Props {
  item: DimItem;
  className?: string;
  hideKeys?: boolean;
  hideButtonLabel?: boolean;
}

export default function ItemTagSelector({ item, className, hideKeys, hideButtonLabel }: Props) {
  const dispatch = useThunkDispatch();
  const tag = useSelector(tagSelector(item));

  const onChange = (tag?: TagValue) => {
    dispatch(
      itemIsInstanced(item)
        ? setItemTag({
            itemId: item.id,
            tag: tag === 'clear' ? undefined : tag,
          })
        : setItemHashTag({
            itemHash: item.hash,
            tag: tag === 'clear' ? undefined : tag,
          })
    );
  };

  const dropdownOptions: Option<TagValue>[] = _.sortBy(
    itemTagSelectorList.map((t) =>
      tag && !t.type
        ? {
            label: tl('Tags.ClearTag'),
            icon: clearIcon,
            hotkey: 'shift+0',
            sortOrder: -1,
          }
        : t
    ),
    (t) => t.sortOrder
  ).map((tagOption) => ({
    key: tagOption.type || 'none',
    content: <TagOption tagOption={tagOption} hideKeys={hideKeys} />,
    value: tagOption.type,
  }));

  return (
    <Select<TagValue>
      options={dropdownOptions}
      value={tag}
      onChange={onChange}
      hideSelected={true}
      className={clsx(className, styles.itemTagSelector, 'item-tag-selector', {
        [styles.minimized]: hideButtonLabel,
      })}
    />
  );
}

function TagOption({ tagOption, hideKeys }: { tagOption: TagInfo; hideKeys?: boolean }) {
  return (
    <div className={styles.item}>
      {tagOption.icon ? <AppIcon icon={tagOption.icon} /> : <div className={styles.null} />}
      <span>{t(tagOption.label)}</span>
      {!hideKeys && tagOption.hotkey && (
        <KeyHelp combo={tagOption.hotkey} className={styles.keyHelp} />
      )}
    </div>
  );
}
