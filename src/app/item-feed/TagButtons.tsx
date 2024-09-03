import { addCompareItem } from 'app/compare/actions';
import { clearNewItem, setTag } from 'app/inventory/actions';
import { TagValue, tagConfig } from 'app/inventory/dim-item-info';
import { DimItem } from 'app/inventory/item-types';
import { hideItemPopup } from 'app/item-popup/item-popup';
import { AppIcon, compareIcon } from 'app/shell/icons';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import _ from 'lodash';
import styles from './TagButtons.m.scss';

/**
 * A row of compact buttons for quick-tagging items.
 */
export default function TagButtons({ item, tag }: { item: DimItem; tag: TagValue | undefined }) {
  const dispatch = useThunkDispatch();
  const tagOptions = _.sortBy(
    Object.values(tagConfig).filter((t) => t.type !== 'archive'),
    (t) => t.sortOrder,
  );

  const handleSetTag = (tag: TagValue) => {
    dispatch(setTag(item, tag));
    dispatch(clearNewItem(item.id));
  };

  const openCompare = () => {
    hideItemPopup();
    dispatch(addCompareItem(item));
  };

  return (
    <div className={styles.tagButtons}>
      <button key="compare" className={styles.tagButton} type="button" onClick={openCompare}>
        <AppIcon icon={compareIcon} />
      </button>
      {tagOptions.map((tagOption) => (
        <button
          key={tagOption.type}
          className={styles.tagButton}
          type="button"
          disabled={tagOption.type === tag}
          onClick={() => handleSetTag(tagOption.type)}
        >
          <AppIcon icon={tagOption.icon} />
        </button>
      ))}
    </div>
  );
}
