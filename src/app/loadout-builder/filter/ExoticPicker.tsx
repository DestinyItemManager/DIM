import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { languageSelector } from 'app/dim-api/selectors';
import { PressTip } from 'app/dim-ui/PressTip';
import Sheet from 'app/dim-ui/Sheet';
import { SheetHorizontalScrollContainer } from 'app/dim-ui/SheetHorizontalScrollContainer';
import { TileGrid, TileGridTile } from 'app/dim-ui/TileGrid';
import { useHotkey } from 'app/hotkeys/useHotkey';
import { DimLanguage } from 'app/i18n';
import { t } from 'app/i18next-t';
import { DimItem } from 'app/inventory/item-types';
import { DefItemIcon } from 'app/inventory/ItemIcon';
import { allItemsSelector } from 'app/inventory/selectors';
import { PlugDefTooltip } from 'app/item-popup/PlugTooltip';
import { isLoadoutBuilderItem } from 'app/loadout/loadout-item-utils';
import { useD2Definitions } from 'app/manifest/selectors';
import { SearchInput } from 'app/search/SearchInput';
import { startWordRegexp } from 'app/search/text-utils';
import { useIsPhonePortrait } from 'app/shell/selectors';
import { uniqBy } from 'app/utils/collections';
import { compareBy, compareByIndex } from 'app/utils/comparators';
import {
  getExtraIntrinsicPerkSockets,
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
import * as styles from './ExoticPicker.m.scss';
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
  // Find all the armor 2/3 exotics.
  const exotics = uniqBy(
    [...allItems, ...vendorItems]
      .filter((item) => item.isExotic && item.classType === classType && isLoadoutBuilderItem(item))
      .sort(compareByIndex(ArmorBucketHashes, (item) => item.bucket.hash)),
    (item) => item.name,
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

export function ExoticPerkPicker({
  lockedExoticHash,
  onSelected,
  onClose,
}: {
  lockedExoticHash?: number;
  onSelected: (selectedPerk1: number, selectedPerk2: number) => void;
  onClose: () => void;
}) {
  const defs = useD2Definitions()!;
  const [selectedPerk1, setSelectedPerk1] = useState<number>(0);
  const [selectedPerk2, setSelectedPerk2] = useState<number>(0);

  const allItems = useSelector(allItemsSelector).filter((item) => item.hash === lockedExoticHash);

  const row1Perks = new Map<number, Set<number>>();
  const row2Perks = new Map<number, Set<number>>();
  for (const item of allItems) {
    const perks = getExtraIntrinsicPerkSockets(item);
    if (
      perks &&
      perks.length === 2 &&
      perks[0].plugged?.plugDef.hash &&
      perks[1].plugged?.plugDef.hash
    ) {
      row1Perks.set(
        perks[0].plugged.plugDef.hash,
        row1Perks.get(perks[0].plugged.plugDef.hash) ?? new Set(),
      );
      row1Perks.get(perks[0].plugged.plugDef.hash)!.add(perks[1].plugged.plugDef.hash);
      row2Perks.set(
        perks[1].plugged.plugDef.hash,
        row2Perks.get(perks[1].plugged.plugDef.hash) ?? new Set(),
      );
      row2Perks.get(perks[1].plugged.plugDef.hash)!.add(perks[0].plugged.plugDef.hash);
    }
  }

  const handlePerk1Click = (perkHash: number) => () => {
    setSelectedPerk1((perk1) => {
      if (perk1 === perkHash) {
        return 0;
      }
      return perkHash;
    });
  };
  const handlePerk2Click = (perkHash: number) => () => {
    setSelectedPerk2((perk2) => {
      if (perk2 === perkHash) {
        return 0;
      }
      return perkHash;
    });
  };

  const footer = ({ onClose }: { onClose: () => void }) => (
    <Footer
      selectedPerk1={selectedPerk1}
      selectedPerk2={selectedPerk2}
      onSubmit={(event) => {
        event.preventDefault();
        onSelected(selectedPerk1, selectedPerk2);
        onClose();
      }}
    />
  );

  return (
    <Sheet
      header={
        <div>
          <h1>{t('LB.ChooseAnExotic')}</h1>
        </div>
      }
      footer={footer}
      onClose={onClose}
      freezeInitialHeight={true}
    >
      <div className={styles.container}>
        <TileGrid header="Row 1">
          {row1Perks
            .keys()
            .map((perkHash) => defs.InventoryItem.get(perkHash))
            .map((perkDef) => (
              <TileGridTile
                key={perkDef.hash}
                selected={selectedPerk1 === perkDef.hash}
                disabled={
                  selectedPerk2 !== 0 && row2Perks.get(selectedPerk2)?.has(perkDef.hash) === false
                }
                title={perkDef.displayProperties.name}
                icon={<DefItemIcon itemDef={perkDef} />}
                onClick={handlePerk1Click(perkDef.hash)}
              >
                {perkDef.displayProperties.description}
              </TileGridTile>
            ))}
        </TileGrid>
        <TileGrid header="Row 2">
          {row2Perks
            .keys()
            .map((perkHash) => defs.InventoryItem.get(perkHash))
            .map((perkDef) => (
              <TileGridTile
                key={perkDef.hash}
                selected={selectedPerk2 === perkDef.hash}
                disabled={
                  selectedPerk1 !== 0 && row1Perks.get(selectedPerk1)?.has(perkDef.hash) === false
                }
                title={perkDef.displayProperties.name}
                icon={<DefItemIcon itemDef={perkDef} />}
                onClick={handlePerk2Click(perkDef.hash)}
              >
                {perkDef.displayProperties.description}
              </TileGridTile>
            ))}
        </TileGrid>
      </div>
    </Sheet>
  );
}

function Footer({
  selectedPerk1,
  selectedPerk2,
  onSubmit,
}: {
  selectedPerk1: number;
  selectedPerk2: number;
  onSubmit: (event: React.FormEvent | KeyboardEvent) => void;
}) {
  const defs = useD2Definitions()!;
  const acceptButtonText = t('LB.SelectPerks');
  useHotkey('enter', acceptButtonText, onSubmit);
  const isPhonePortrait = useIsPhonePortrait();

  const displayPerk = (selectedPerk: number) => {
    const def = defs.InventoryItem.get(selectedPerk);
    return (
      def !== undefined && (
        <PressTip tooltip={<PlugDefTooltip def={def} />}>
          <DefItemIcon itemDef={def} />
          {def.displayProperties.name}
        </PressTip>
      )
    );
  };

  return (
    <div className={styles.footer}>
      <button type="button" className={styles.submitButton} onClick={onSubmit}>
        {!isPhonePortrait && '⏎ '}
        {acceptButtonText}
      </button>
      <SheetHorizontalScrollContainer className={styles.selectedPerks}>
        {selectedPerk1 !== 0 && <>{displayPerk(selectedPerk1)}</>}
        {selectedPerk2 !== 0 && <>{displayPerk(selectedPerk2)}</>}
      </SheetHorizontalScrollContainer>
    </div>
  );
}
