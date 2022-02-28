import CheckButton from 'app/dim-ui/CheckButton';
import ClassIcon from 'app/dim-ui/ClassIcon';
import { t } from 'app/i18next-t';
import ConnectedInventoryItem from 'app/inventory/ConnectedInventoryItem';
import { getTag, TagValue } from 'app/inventory/dim-item-info';
import { DimItem } from 'app/inventory/item-types';
import ItemPopupTrigger from 'app/inventory/ItemPopupTrigger';
import { allItemsSelector, itemInfosSelector } from 'app/inventory/selectors';
import { useSetting } from 'app/settings/hooks';
import { acquisitionRecencyComparator } from 'app/shell/filters';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import { AnimatePresence, motion, Spring } from 'framer-motion';
import _ from 'lodash';
import React, { memo } from 'react';
import { useSelector } from 'react-redux';
import { createSelector } from 'reselect';
import Highlights from './Highlights';
import styles from './ItemFeed.m.scss';
import TagButtons from './TagButtons';

const spring: Spring = {
  type: 'spring',
  duration: 0.3,
  bounce: 0,
};

const Item = memo(function Item({ item, tag }: { item: DimItem; tag: TagValue | undefined }) {
  return (
    <motion.div
      className={styles.item}
      initial={{ scale: 0, opacity: 0 }}
      exit={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={spring}
    >
      <ItemPopupTrigger item={item}>
        {(ref, onClick) => <ConnectedInventoryItem item={item} innerRef={ref} onClick={onClick} />}
      </ItemPopupTrigger>
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
    </motion.div>
  );
});

const filteredItemsSelector = createSelector(allItemsSelector, (allItems) =>
  allItems
    .filter((i) => i.equipment && i.power > 0 && i.taggable)
    .sort(acquisitionRecencyComparator)
);

/**
 * An ordered list of items as they are acquired, optionally hiding items that
 * have been tagged. The idea is to be able to keep track of what drops you're
 * getting, and ideally to tag them all as they're coming in.
 */
export default function ItemFeed({ itemsToShow }: { itemsToShow: number }) {
  const allItems = useSelector(filteredItemsSelector);
  const itemInfos = useSelector(itemInfosSelector);
  const [hideTagged, setHideTagged] = useSetting('itemFeedHideTagged');

  const items = _.take(
    allItems.filter((i) => !hideTagged || !getTag(i, itemInfos)),
    itemsToShow
  );

  return (
    <>
      <CheckButton name="hideTagged" checked={hideTagged} onChange={setHideTagged}>
        {t('ItemFeed.HideTagged')}
      </CheckButton>
      <AnimatePresence initial={false}>
        {items.map((item) => (
          <Item key={item.index} item={item} tag={getTag(item, itemInfos)} />
        ))}
      </AnimatePresence>
    </>
  );
}
