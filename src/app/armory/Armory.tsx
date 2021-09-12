import { DestinyAccount } from 'app/accounts/destiny-account';
import { languageSelector } from 'app/dim-api/selectors';
import BungieImage, { bungieNetPath } from 'app/dim-ui/BungieImage';
import CollapsibleTitle from 'app/dim-ui/CollapsibleTitle';
import ElementIcon from 'app/dim-ui/ElementIcon';
import ExternalLink from 'app/dim-ui/ExternalLink';
import ShowPageLoading from 'app/dim-ui/ShowPageLoading';
import { t } from 'app/i18next-t';
import ConnectedInventoryItem from 'app/inventory/ConnectedInventoryItem';
import InventoryItem from 'app/inventory/InventoryItem';
import { DimItem } from 'app/inventory/item-types';
import ItemPopupTrigger from 'app/inventory/ItemPopupTrigger';
import RatingIcon from 'app/inventory/RatingIcon';
import { allItemsSelector, bucketsSelector, storesLoadedSelector } from 'app/inventory/selectors';
import { makeFakeItem } from 'app/inventory/store/d2-item-factory';
import { useLoadStores } from 'app/inventory/store/hooks';
import { getEvent, getSeason } from 'app/inventory/store/season';
import EmblemPreview from 'app/item-popup/EmblemPreview';
import { LoreLink } from 'app/item-popup/ItemDescription';
import ItemDetails from 'app/item-popup/ItemDetails';
import { AmmoIcon, destinyDBLink, ItemTypeName } from 'app/item-popup/ItemPopupHeader';
import ItemStats from 'app/item-popup/ItemStats';
import MetricCategories from 'app/item-popup/MetricCategories';
import { useDefinitions } from 'app/manifest/selectors';
import { getItemYear } from 'app/utils/item-utils';
import { wishListRollsForItemHashSelector } from 'app/wishlists/selectors';
import { UiWishListRoll } from 'app/wishlists/wishlists';
import clsx from 'clsx';
import { D2EventInfo } from 'data/d2/d2-event-info';
import { ItemCategoryHashes } from 'data/d2/generated-enums';
import _ from 'lodash';
import React from 'react';
import { useSelector } from 'react-redux';
import styles from './Armory.m.scss';

const links = {
  'Light.gg': (item: DimItem, language: string) =>
    `https://www.light.gg/db/${language}/items/${item.hash}`,
  DestinyTracker: destinyDBLink,
  'data.destinysets.com': (item: DimItem, language: string) =>
    `https://data.destinysets.com/i/InventoryItem:${item.hash}?lang=${language}`,
};

export default function Armory({
  account,
  itemHash,
}: {
  account: DestinyAccount;
  itemHash: number;
}) {
  const defs = useDefinitions();
  const storesLoaded = useSelector(storesLoadedSelector);
  useLoadStores(account, storesLoaded);
  const buckets = useSelector(bucketsSelector)!;
  const allItems = useSelector(allItemsSelector);
  const wishlistRolls = useSelector(wishListRollsForItemHashSelector(itemHash));
  const language = useSelector(languageSelector);

  if (!storesLoaded || !defs) {
    return <ShowPageLoading message={t('Loading.Profile')} />;
  }

  if (defs.isDestiny1()) {
    return <div>TODO: add D1 support</div>;
  }

  const itemDef = defs.InventoryItem.get(itemHash);

  const item = defs.isDestiny2() ? makeFakeItem(defs, buckets, undefined, itemHash) : undefined;

  if (!item) {
    return (
      <div className="dim-page">
        <h1>Unknown Item</h1>
      </div>
    );
  }

  const storeItems = allItems.filter((i) => i.hash === itemHash);

  const collectible = item.collectibleHash ? defs.Collectible.get(item.collectibleHash) : undefined;

  const seasonNum = getSeason(item);
  const season = seasonNum
    ? Object.values(defs.Season.getAll()).find((s) => s.seasonNumber === seasonNum)
    : undefined;
  const event = getEvent(item);

  const screenshot = itemDef.screenshot;
  const flavorText = itemDef.flavorText || itemDef.displaySource;

  console.log({ item });

  return (
    <div
      className={clsx('dim-page', styles.armory)}
      style={
        screenshot
          ? {
              backgroundImage: `linear-gradient(180deg, rgba(0,0,0,.75) 0px, rgba(0,0,0,0) 200px), url("${bungieNetPath(
                screenshot
              )}")`,
            }
          : undefined
      }
    >
      <ul className={styles.links}>
        {_.map(links, (link, name) => (
          <li key={name}>
            <ExternalLink href={link(item, language)}>{name}</ExternalLink>
          </li>
        ))}
        {item.loreHash && (
          <li>
            <LoreLink loreHash={item.loreHash} />
          </li>
        )}
      </ul>
      <div className={styles.header}>
        <InventoryItem item={item} />
        <div>
          <h1>{item.name}</h1>
          <div className={styles.subtitle}>
            <ElementIcon element={item.element} />
            {item.breakerType && <BungieImage src={item.breakerType.displayProperties.icon} />}
            {item.destinyVersion === 2 && item.ammoType > 0 && <AmmoIcon type={item.ammoType} />}
            <ItemTypeName item={item} />
            {season && (
              <div className={styles.source}>
                {season.displayProperties.hasIcon && (
                  <BungieImage height={15} width={15} src={season.displayProperties.icon} />
                )}{' '}
                {season.displayProperties.name} (Season {season.seasonNumber}, Year{' '}
                {getItemYear(item)}){event && <span> - {D2EventInfo[getEvent(item)].name}</span>}
              </div>
            )}
          </div>
          {item.classified && <div>{t('ItemService.Classified2')}</div>}
          {collectible?.sourceString && <div>{collectible?.sourceString}</div>}
          {item.description && <p>{item.description}</p>}
          {flavorText && <p className={styles.flavor}>{flavorText}</p>}
          {item.bucket.inArmor && (
            <div>
              Collectible parents:
              {collectible?.parentNodeHashes.map(
                (n) => defs.PresentationNode.get(n).displayProperties.name
              )}
            </div>
          )}
        </div>
      </div>

      {defs.isDestiny2() && item.itemCategoryHashes.includes(ItemCategoryHashes.Emblems) && (
        <div className="item-details">
          <EmblemPreview item={item} />
        </div>
      )}

      {defs.isDestiny2() && item.availableMetricCategoryNodeHashes && (
        <div className="item-details">
          <MetricCategories
            availableMetricCategoryNodeHashes={item.availableMetricCategoryNodeHashes}
          />
        </div>
      )}

      {item.stats && !item.bucket.inArmor && (
        <div className={styles.stats}>
          <ItemStats item={item} />
        </div>
      )}

      <ItemDetails item={item} />

      <CollapsibleTitle sectionId="armory-perks" title="Perks">
        <h2>Perks</h2>
        <div>Archetype</div>
        <div>Curated Roll</div>
        <div>perk options</div>
      </CollapsibleTitle>
      <h2>Objectives/Quest steps/rewards</h2>
      <h2>Catalyst??</h2>
      <CollapsibleTitle sectionId="armory-items" title="Yours">
        <div className="sub-bucket">
          {storeItems.length > 0 ? (
            storeItems.map((i) => (
              <ItemPopupTrigger item={i} key={i.index}>
                {(ref, onClick) => (
                  <ConnectedInventoryItem innerRef={ref} onClick={onClick} item={i} />
                )}
              </ItemPopupTrigger>
            ))
          ) : (
            <div>You don't have any of these</div>
          )}
        </div>
      </CollapsibleTitle>
      <CollapsibleTitle sectionId="armory-wishlist" title="Wishlisted Rolls">
        {wishlistRolls.map((r, i) => (
          <div key={i}>
            <RatingIcon
              uiWishListRoll={r.isUndesirable ? UiWishListRoll.Bad : UiWishListRoll.Good}
            />
            <div>
              {Array.from(
                r.recommendedPerks,
                (h) => defs.InventoryItem.get(h).displayProperties.name
              )}
            </div>
            <div>{r.notes}</div>
          </div>
        ))}
      </CollapsibleTitle>
    </div>
  );
}
