import { DestinyAccount } from 'app/accounts/destiny-account';
import { languageSelector } from 'app/dim-api/selectors';
import BungieImage from 'app/dim-ui/BungieImage';
import ExternalLink from 'app/dim-ui/ExternalLink';
import ShowPageLoading from 'app/dim-ui/ShowPageLoading';
import { t } from 'app/i18next-t';
import ConnectedInventoryItem from 'app/inventory/ConnectedInventoryItem';
import InventoryItem from 'app/inventory/InventoryItem';
import { DimItem } from 'app/inventory/item-types';
import RatingIcon from 'app/inventory/RatingIcon';
import { allItemsSelector, bucketsSelector, storesLoadedSelector } from 'app/inventory/selectors';
import { source } from 'app/inventory/spreadsheets';
import { makeFakeItem } from 'app/inventory/store/d2-item-factory';
import { useLoadStores } from 'app/inventory/store/hooks';
import { getEvent, getSeason } from 'app/inventory/store/season';
import ItemPopupBody, { ItemPopupTab } from 'app/item-popup/ItemPopupBody';
import ItemPopupHeader, { destinyDBLink } from 'app/item-popup/ItemPopupHeader';
import { useDefinitions } from 'app/manifest/selectors';
import { getItemYear } from 'app/utils/item-utils';
import { wishListRollsForItemHashSelector } from 'app/wishlists/selectors';
import { UiWishListRoll } from 'app/wishlists/wishlists';
import { D2EventInfo } from 'data/d2/d2-event-info';
import { D2SeasonInfo } from 'data/d2/d2-season-info';
import _ from 'lodash';
import React from 'react';
import { useSelector } from 'react-redux';

const ignoredCategories: number[] = [];

const links = {
  'Light.gg': (item: DimItem, language: string) =>
    `https://www.light.gg/db/${language}/items/${item.hash}`,
  DestinyTracker: destinyDBLink,
  D2Gunsmith: (item: DimItem) => `https://d2gunsmith.com/w/${item.hash}`,
  DDS: (item: DimItem) => `https://data.destinysets.com/i/InventoryItem:${item.hash}`,
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

  const categories = _.compact(
    item.itemCategoryHashes
      .filter((c) => !ignoredCategories.includes(c))
      .map((c) => defs.ItemCategory.get(c))
  );

  const collectible = item.collectibleHash ? defs.Collectible.get(item.collectibleHash) : undefined;

  return (
    <div className="dim-page">
      <h1>{item.name}</h1>
      <div>{itemDef.displayProperties.description}</div>
      <div>{itemDef.displaySource}</div>
      <div>{itemDef.flavorText}</div>
      <div>{itemDef.secondaryIcon}</div>
      <div>{itemDef.secondaryOverlay}</div>
      <div>{itemDef.secondarySpecial}</div>
      <div>
        {categories.map((c) => (
          <div key={c.hash}>
            {c.displayProperties.name} {c.hash}
          </div>
        ))}
      </div>
      <ul>
        {_.map(links, (link, name) => (
          <li key={name}>
            <ExternalLink href={link(item, language)}>{name}</ExternalLink>
          </li>
        ))}
      </ul>
      <div>
        <BungieImage width={400} src={itemDef.screenshot} />
      </div>
      {item.loreHash && (
        <div>
          <ExternalLink href={`https://www.ishtar-collective.net/items/${item.hash}`}>
            Lore
          </ExternalLink>
        </div>
      )}
      <div>{item.displaySource}</div>
      <div>{collectible?.sourceString}</div>
      <div>
        {collectible?.parentNodeHashes.map(
          (n) => defs.PresentationNode.get(n).displayProperties.name
        )}
      </div>
      <div>{source(item)}</div>
      <div>
        Season {getSeason(item)} ({D2SeasonInfo[getSeason(item)].seasonName} - TODO: use season def)
        (Year {getItemYear(item)})
      </div>
      <div>{getEvent(item) ? D2EventInfo[getEvent(item)].name : undefined}</div>
      <div>{itemDef.setData?.questLineName}</div>
      <ItemPopupHeader item={item} />
      <ItemPopupBody item={item} tab={ItemPopupTab.Overview} onTabChanged={_.noop} />
      <InventoryItem item={item} />
      <h2>What you got</h2>
      <div className="store-bucket">
        {storeItems.length > 0 ? (
          storeItems.map((i) => <ConnectedInventoryItem key={i.index} item={i} />)
        ) : (
          <div>You don't have any of these</div>
        )}
      </div>
      <h2>Wishlists</h2>
      <div>
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
      </div>
    </div>
  );
}
