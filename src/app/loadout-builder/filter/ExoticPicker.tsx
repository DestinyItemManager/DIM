import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { languageSelector } from 'app/dim-api/selectors';
import Sheet from 'app/dim-ui/Sheet';
import { TileGrid } from 'app/dim-ui/TileGrid';
import { DimLanguage } from 'app/i18n';
import { t } from 'app/i18next-t';
import { DimItem } from 'app/inventory/item-types';
import { allItemsSelector } from 'app/inventory/selectors';
import { isLoadoutBuilderItem } from 'app/loadout/loadout-item-utils';
import { useD2Definitions } from 'app/manifest/selectors';
import { SearchInput } from 'app/search/SearchInput';
import { startWordRegexp } from 'app/search/text-utils';
import { uniqBy } from 'app/utils/collections';
import { compareBy, compareByIndex } from 'app/utils/comparators';
import {
  socketContainsIntrinsicPlug,
  socketContainsPlugWithCategory,
} from 'app/utils/socket-utils';
import { DestinyClass, TierType } from 'bungie-api-ts/destiny2';
import { PlugCategoryHashes } from 'data/d2/generated-enums';
import anyExoticIcon from 'images/anyExotic.svg';
import noExoticIcon from 'images/noExotic.svg';
import noExoticPreferenceIcon from 'images/noExoticPreference.svg';
import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { ArmorBucketHashes, LOCKED_EXOTIC_ANY_EXOTIC, LOCKED_EXOTIC_NO_EXOTIC } from '../types';
import styles from './ExoticPicker.m.scss';
import ExoticTile, { FakeExoticTile, LockedExoticWithPlugs } from './ExoticTile';

/**
 * Find all exotic armor in this character's inventory that could be locked in LO.
 */
export function findLockableExotics(
  allItems: DimItem[],
  vendorItems: DimItem[],
  classType: DestinyClass,
  defs: D2ManifestDefinitions,
) {
  // Find all the armor 2 exotics.
  const exotics = uniqBy(
    [...allItems, ...vendorItems]
      .filter((item) => item.isExotic && item.classType === classType && isLoadoutBuilderItem(item))
      .sort(compareByIndex(ArmorBucketHashes, (item) => item.bucket.hash)),
    (item) => item.hash,
  );

  // Add in armor 1 exotics that don't have an armor 2 version
  const exoticArmorWithoutEnergy = allItems.filter(
    (item) => item.isExotic && item.bucket.inArmor && item.classType === classType && !item.energy,
  );
  for (const unusable of exoticArmorWithoutEnergy) {
    // Armor 1 & 2 items have different hashes but the same name.
    if (!exotics.some((exotic) => unusable.name === exotic.name)) {
      exotics.push(unusable);
    }
  }

  // Build up all the details we need to display the exotics properly
  const rtn: LockedExoticWithPlugs[] = [];
  for (const item of exotics) {
    const def = defs.InventoryItem.get(item.hash);

    if (def?.displayProperties.hasIcon) {
      const { exoticPerk, exoticMods } = resolveExoticInfo(item);
      rtn.push({
        def,
        exoticPerk,
        exoticMods,
        isArmor1: !item.energy,
      });
    }
  }

  return rtn;
}

export function resolveExoticInfo(item: DimItem) {
  const exoticPerk = item.sockets?.allSockets.find(
    (socket) =>
      socketContainsIntrinsicPlug(socket) &&
      socket.plugged.plugDef.inventory?.tierType === TierType.Exotic,
  )?.plugged?.plugDef;

  const exoticMods =
    item.sockets?.allSockets
      .find((socket) =>
        socketContainsPlugWithCategory(socket, PlugCategoryHashes.EnhancementsExoticAeonCult),
      )
      ?.plugSet?.plugs.map((dimPlug) => dimPlug.plugDef) || [];
  return { exoticPerk, exoticMods } as const;
}

/**
 * Filter exotics by any search query and group them by bucket
 */
function filterAndGroupExotics(
  defs: D2ManifestDefinitions,
  query: string,
  language: DimLanguage,
  lockableExotics: LockedExoticWithPlugs[],
) {
  const regexp = startWordRegexp(query, language);

  // We filter items by looking at name and description of items, perks and exotic mods.
  const filteredExotics = query.length
    ? lockableExotics.filter(
        (exotic) =>
          regexp.test(exotic.def.displayProperties.name) ||
          regexp.test(exotic.def.displayProperties.description) ||
          regexp.test(exotic.exoticPerk?.displayProperties.name || '') ||
          regexp.test(exotic.exoticPerk?.displayProperties.description || '') ||
          exotic.exoticMods?.some(
            (exoticMod) =>
              regexp.test(exoticMod.displayProperties.name) ||
              regexp.test(exoticMod.displayProperties.description),
          ) ||
          exotic.exoticPerk?.perks.some(
            (perk) =>
              perk.perkHash &&
              regexp.test(defs.SandboxPerk.get(perk.perkHash)?.displayProperties.description),
          ),
      )
    : lockableExotics;

  // Group by bucketHash then preserve the initial ordering as they were already
  // ordered helmet, arms, chest, and legs
  const groupedExotics = Map.groupBy(
    filteredExotics,
    (exotic) => exotic.def.inventory!.bucketTypeHash,
  );
  const orderedAndGroupedExotics = [...groupedExotics.values()].sort(
    compareByIndex(filteredExotics, (exotics) => exotics[0]),
  );

  // Sort each of the individual groups by name
  for (const group of orderedAndGroupedExotics) {
    group.sort(compareBy((exotic) => exotic.def.displayProperties.name));
  }

  return orderedAndGroupedExotics;
}

/** A drawer to select an exotic for your build. */
export default function ExoticPicker({
  lockedExoticHash,
  classType,
  vendorItems,
  onSelected,
  onClose,
}: {
  lockedExoticHash?: number;
  classType: DestinyClass;
  vendorItems: DimItem[];
  onSelected: (lockedExoticHash: number | undefined) => void;
  onClose: () => void;
}) {
  const defs = useD2Definitions()!;
  const language = useSelector(languageSelector);
  const [query, setQuery] = useState('');

  const allItems = useSelector(allItemsSelector);

  const lockableExotics = useMemo(
    () => findLockableExotics(allItems, vendorItems, classType, defs),
    [allItems, vendorItems, classType, defs],
  );

  const filteredOrderedAndGroupedExotics = useMemo(
    () => filterAndGroupExotics(defs, query, language, lockableExotics),
    [defs, query, language, lockableExotics],
  );

  return (
    <Sheet
      header={
        <div>
          <h1>{t('LB.ChooseAnExotic')}</h1>
          <SearchInput
            query={query}
            onQueryChanged={setQuery}
            placeholder={t('LB.SearchAnExotic')}
            autoFocus
          />
        </div>
      }
      onClose={onClose}
      freezeInitialHeight={true}
    >
      {({ onClose }) => (
        <div className={styles.container}>
          <TileGrid header={t('LoadoutBuilder.ExoticSpecialCategory')}>
            <FakeExoticTile
              selected={lockedExoticHash === LOCKED_EXOTIC_NO_EXOTIC}
              title={t('LoadoutBuilder.NoExotic')}
              description={t('LoadoutBuilder.NoExoticDescription')}
              icon={noExoticIcon}
              onSelected={() => {
                onSelected(LOCKED_EXOTIC_NO_EXOTIC);
                onClose();
              }}
            />
            <FakeExoticTile
              selected={lockedExoticHash === LOCKED_EXOTIC_ANY_EXOTIC}
              title={t('LoadoutBuilder.AnyExotic')}
              description={t('LoadoutBuilder.AnyExoticDescription')}
              icon={anyExoticIcon}
              onSelected={() => {
                onSelected(LOCKED_EXOTIC_ANY_EXOTIC);
                onClose();
              }}
            />
            <FakeExoticTile
              selected={lockedExoticHash === undefined}
              title={t('LoadoutBuilder.NoExoticPreference')}
              description={t('LoadoutBuilder.NoExoticPreferenceDescription')}
              icon={noExoticPreferenceIcon}
              onSelected={() => {
                onSelected(undefined);
                onClose();
              }}
            />
          </TileGrid>
          {filteredOrderedAndGroupedExotics.map((exotics) => (
            <TileGrid
              key={exotics[0].def.inventory!.bucketTypeHash}
              header={exotics[0].def.itemTypeDisplayName}
            >
              {exotics.map((exotic) => (
                <ExoticTile
                  key={exotic.def.hash}
                  selected={lockedExoticHash === exotic.def.hash}
                  exotic={exotic}
                  onSelected={() => {
                    onSelected(exotic.def.hash);
                    onClose();
                  }}
                />
              ))}
            </TileGrid>
          ))}
        </div>
      )}
    </Sheet>
  );
}
