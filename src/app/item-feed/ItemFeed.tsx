import CheckButton from 'app/dim-ui/CheckButton';
import ClassIcon from 'app/dim-ui/ClassIcon';
import { VirtualList, WindowVirtualList } from 'app/dim-ui/VirtualList';
import { t } from 'app/i18next-t';
import ConnectedInventoryItem from 'app/inventory/ConnectedInventoryItem';
import DraggableInventoryItem from 'app/inventory/DraggableInventoryItem';
import ItemPopupTrigger from 'app/inventory/ItemPopupTrigger';
import { TagValue } from 'app/inventory/dim-item-info';
import { DimItem } from 'app/inventory/item-types';
import { allItemsSelector, getTagSelector } from 'app/inventory/selectors';
import { useSetting } from 'app/settings/hooks';
import { getItemRecencyKey, isNewerThan } from 'app/shell/item-comparators';
import { useIsPhonePortrait } from 'app/shell/selectors';
import { compareBy, reverseComparator } from 'app/utils/comparators';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import { memo } from 'react';
import { useSelector } from 'react-redux';
import { createSelector } from 'reselect';
import Highlights from './Highlights';
import styles from './ItemFeed.m.scss';
import TagButtons from './TagButtons';

const Item = memo(function Item({ item, tag }: { item: DimItem; tag: TagValue | undefined }) {
  const isPhonePortrait = useIsPhonePortrait();
  const itemIcon = (
    <ItemPopupTrigger item={item}>
      {(ref, onClick) => <ConnectedInventoryItem item={item} ref={ref} onClick={onClick} />}
    </ItemPopupTrigger>
  );
  return (
    <div className={styles.item}>
      {isPhonePortrait ? (
        itemIcon
      ) : (
        <DraggableInventoryItem item={item} anyBucket={true}>
          {itemIcon}
        </DraggableInventoryItem>
      )}
      <div className={styles.info}>
        <div className={styles.title}>
          {item.name}
          {item.classType !== DestinyClass.Unknown && (
            <ClassIcon classType={item.classType} className={styles.classIcon} />
          )}
        </div>
        <Highlights item={item} />
        <TagButtons item={item} tag={tag} />
      </div>
    </div>
  );
});

const filteredItemsSelector = createSelector(allItemsSelector, (allItems) =>
  allItems
    .filter((i) => i.equipment && i.power > 0 && i.taggable)
    .sort(reverseComparator(compareBy(getItemRecencyKey))),
);

const estimatedSize = 120;
const overscan = 10;

/**
 * An ordered list of items as they are acquired, optionally hiding items that
 * have been tagged. The idea is to be able to keep track of what drops you're
 * getting, and ideally to tag them all as they're coming in.
 */
export default function ItemFeed({ page }: { page?: boolean }) {
  const allItems = useSelector(filteredItemsSelector);
  const getTag = useSelector(getTagSelector);
  const [hideTagged, setHideTagged] = useSetting('itemFeedHideTagged');
  const [itemFeedWatermark, setItemFeedWatermark] = useSetting('itemFeedWatermark');

  const untaggedItems = hideTagged ? allItems.filter((i) => !hideTagged || !getTag(i)) : allItems;

  const items = untaggedItems.filter((i) => isNewerThan(i, itemFeedWatermark));

  const header = (
    <>
      <CheckButton name="hideTagged" checked={hideTagged} onChange={setHideTagged}>
        {t('ItemFeed.HideTagged')}
      </CheckButton>
      {items.length > 0 && (
        <button
          type="button"
          className={clsx('dim-button', styles.clearButton)}
          onClick={() => setItemFeedWatermark(allItems[0].id)}
        >
          {t('ItemFeed.ClearFeed')}
        </button>
      )}
      {items.length === 0 && untaggedItems.length > 0 && (
        <>
          <button
            type="button"
            className={clsx('dim-button', styles.clearButton)}
            onClick={() => {
              setItemFeedWatermark('0');
            }}
          >
            {t('ItemFeed.ShowOlderItems')}
          </button>
          <p>{t('ItemFeed.NoNewItems')}</p>
        </>
      )}
    </>
  );

  const numItems = items.length + 1; // one more for the header
  const renderItem = (index: number) => {
    if (index === 0) {
      return header;
    }
    const item = items[index - 1];
    return <Item item={item} tag={getTag(item)} />;
  };
  const getItemKey = (index: number) => {
    if (index === 0) {
      return 'header;';
    }
    const item = items[index - 1];
    return item.index;
  };

  return page ? (
    <WindowVirtualList
      numElements={numItems}
      estimatedSize={estimatedSize}
      overscan={overscan}
      getItemKey={getItemKey}
    >
      {renderItem}
    </WindowVirtualList>
  ) : (
    <VirtualList
      className={styles.list}
      numElements={numItems}
      estimatedSize={estimatedSize}
      overscan={overscan}
      getItemKey={getItemKey}
    >
      {renderItem}
    </VirtualList>
  );
}
