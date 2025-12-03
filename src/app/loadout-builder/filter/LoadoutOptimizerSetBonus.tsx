import { SetBonusCounts } from '@destinyitemmanager/dim-api-types';
import Sheet from 'app/dim-ui/Sheet';
import { SheetHorizontalScrollContainer } from 'app/dim-ui/SheetHorizontalScrollContainer';
import { TileGrid, TileGridTile } from 'app/dim-ui/TileGrid';
import { useHotkey } from 'app/hotkeys/useHotkey';
import { t } from 'app/i18next-t';
import { DimItem } from 'app/inventory/item-types';
import { allItemsSelector } from 'app/inventory/selectors';
import { SetBonus, SetPerkIcon } from 'app/item-popup/SetBonus';
import LoadoutEditSection from 'app/loadout/loadout-edit/LoadoutEditSection';
import { isLoadoutBuilderItem } from 'app/loadout/loadout-item-utils';
import { useD2Definitions } from 'app/manifest/selectors';
import { useIsPhonePortrait } from 'app/shell/selectors';
import { uniqBy } from 'app/utils/collections';
import { DestinyClass, DestinyItemSetPerkDefinition } from 'bungie-api-ts/destiny2';
import { countBy, sum } from 'es-toolkit';
import { Dispatch, memo, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { LoadoutBuilderAction } from '../loadout-builder-reducer';
import * as styles from './LoadoutOptimizerSetBonus.m.scss';

const LoadoutOptimizerSetBonus = memo(function LoadoutOptimizerSetBonus({
  storeId,
  setBonuses,
  lbDispatch,
  className,
  classType,
  vendorItems,
}: {
  storeId: string;
  setBonuses: SetBonusCounts;
  lbDispatch: Dispatch<LoadoutBuilderAction>;
  className?: string;
  classType: DestinyClass;
  vendorItems: DimItem[];
}) {
  const defs = useD2Definitions()!;
  const allItems = useSelector(allItemsSelector);
  const [showSetBonusPicker, setShowSetBonusPicker] = useState(false);
  const handleClear = () => {
    lbDispatch({ type: 'removeSetBonuses' });
  };
  const handleUpdateSetBonuses = (setBonuses: SetBonusCounts) =>
    lbDispatch({ type: 'setSetBonuses', setBonuses });

  const showPicker = () => setShowSetBonusPicker(true);
  const hidePicker = () => setShowSetBonusPicker(false);

  const handleSyncFromEquipped = () => {
    const equippedSetBonuses = allItems.filter(
      (i) => i.equipped && isLoadoutBuilderItem(i) && i.owner === storeId && i.setBonus,
    );

    const newSetBonuses: SetBonusCounts = {};
    for (const item of equippedSetBonuses) {
      newSetBonuses[item.setBonus!.hash] = (newSetBonuses[item.setBonus!.hash] || 0) + 1;
    }

    for (const setHash in newSetBonuses) {
      // Round down to the nearest perk requirement. e.g. if you have 3 pieces,
      // round down to 2, and if you have 1 piece, remove it.
      const setDef = defs.EquipableItemSet.get(Number(setHash));
      // Perk requirements from high to low
      const perkPoints = [
        ...(setDef?.setPerks.map((p) => p.requiredSetCount) || []).sort((a, b) => b - a),
        0,
      ];
      const pieceCount = newSetBonuses[setHash] ?? 0;
      for (const perkCount of perkPoints) {
        if (pieceCount >= perkCount) {
          newSetBonuses[setHash] = perkCount;
          break;
        }
      }
      if (newSetBonuses[setHash] === 0) {
        delete newSetBonuses[setHash];
      }
    }
    lbDispatch({ type: 'setSetBonuses', setBonuses: newSetBonuses });
  };

  return (
    <LoadoutEditSection
      title={t('LoadoutBuilder.SetBonus')}
      className={className}
      onClear={handleClear}
      onSyncFromEquipped={handleSyncFromEquipped}
    >
      <div onClick={showPicker} className={styles.setBonuses}>
        <SetBonusDisplay setBonuses={setBonuses} />
      </div>
      <button type="button" className="dim-button" onClick={showPicker}>
        {t('LB.SelectSetBonus')}
      </button>
      {showSetBonusPicker && (
        <SetBonusPicker
          initialSetBonuses={setBonuses}
          classType={classType}
          vendorItems={vendorItems}
          onAccept={handleUpdateSetBonuses}
          onClose={hidePicker}
        />
      )}
    </LoadoutEditSection>
  );
});

export default LoadoutOptimizerSetBonus;

/**
 * Returns a list of set bonuses available for the given class type, and how
 * many pieces could be used for each.
 */
function findSetBonuses(
  allItems: DimItem[],
  vendorItems: DimItem[],
  classType: DestinyClass,
): SetBonusCounts {
  // One item from each bucket with a set bonus
  const setBonusExemplars = uniqBy(
    [...allItems, ...vendorItems].filter(
      (item) => item.classType === classType && item.setBonus && isLoadoutBuilderItem(item),
    ),
    (item) => `${item.setBonus!.hash}-${item.bucket.hash}`,
  );
  // Get the max number of items we could have available for each set bonus
  return countBy(setBonusExemplars, (i) => i.setBonus!.hash);
}

export function SetBonusPicker({
  initialSetBonuses,
  classType,
  vendorItems,
  onAccept,
  onClose,
}: {
  /** Initial Set bonus hashes mapped to desired item counts. */
  initialSetBonuses: SetBonusCounts;
  /** The character class we'll show set bonuses for. */
  classType: DestinyClass;
  /** All vendor items that could be used for set bonuses. */
  vendorItems: DimItem[];
  /** Called with the new SetBonusCounts when the user accepts the new selections. */
  onAccept: (setBonuses: SetBonusCounts) => void;
  /** Called when the user accepts the new perk selections or closes the sheet. */
  onClose: () => void;
}) {
  const defs = useD2Definitions()!;

  // TODO search functionality
  // const language = useSelector(languageSelector);
  // const [query, setQuery] = useState('');
  const [setBonuses, setSetBonuses] = useState(initialSetBonuses);

  const allItems = useSelector(allItemsSelector);

  const possibleSetBonuses = useMemo(
    () => findSetBonuses(allItems, vendorItems, classType),
    [allItems, vendorItems, classType],
  );

  // Only allow choosing set bonuses the user has items for
  const sets = Object.keys(possibleSetBonuses)
    .map((h) => defs.EquipableItemSet.get(parseInt(h, 10)))
    .filter((set) => !set.redacted);

  const totalSelected = sum(Object.values(setBonuses));

  const selected = (perk: DestinyItemSetPerkDefinition, setHash: number) =>
    (setBonuses[setHash] ?? 0) >= perk.requiredSetCount;

  // TODO: This logic isn't quite right, since it doesn't take into account sets
  // that we don't have a piece in every slot for. For example if you only have
  // helmet and chest for two different sets, and you've already selected one of
  // them, you can't select the other one.
  const disabled = (perk: DestinyItemSetPerkDefinition, setHash: number) =>
    // Either we don't have enough items to ever make this happen
    (possibleSetBonuses[setHash] ?? 0) < perk.requiredSetCount ||
    // Or the remaining unselected items would not allow us to reach the required set count
    (!selected(perk, setHash) &&
      totalSelected - (setBonuses[setHash] ?? 0) + perk.requiredSetCount > 5);

  const footer = ({ onClose }: { onClose: () => void }) => (
    <Footer
      setBonuses={setBonuses}
      onSubmit={(event) => {
        event.preventDefault();
        onAccept(setBonuses);
        onClose();
      }}
    />
  );

  const handlePerkClick = (setHash: number, perkRequiredCount: number) => () => {
    setSetBonuses((setBonuses) => {
      const newSetBonuses = { ...setBonuses };
      if ((setBonuses[setHash] || 0) === perkRequiredCount) {
        delete newSetBonuses[setHash];
      } else {
        newSetBonuses[setHash] = perkRequiredCount;
      }
      return newSetBonuses;
    });
  };

  return (
    <Sheet
      header={
        <div>
          <h1>{t('LB.ChooseASetBonus')}</h1>
          {/* TODO search functionality
          <SearchInput
            query={query}
            onQueryChanged={setQuery}
            placeholder={t('LB.SearchASetBonus')}
            autoFocus
          /> */}
        </div>
      }
      footer={footer}
      onClose={onClose}
      freezeInitialHeight={true}
    >
      <div className={styles.container}>
        {sets.map((set) => (
          <TileGrid key={set.hash} header={set.displayProperties.name}>
            {set.setPerks.map((perk) => {
              const perkDef = defs.SandboxPerk.get(perk.sandboxPerkHash);
              return (
                <TileGridTile
                  key={perkDef.hash}
                  selected={selected(perk, set.hash)}
                  disabled={disabled(perk, set.hash)}
                  title={
                    <>
                      {perkDef.displayProperties.name}
                      <div className={styles.setCount}>
                        {t('Item.SetBonus.NPiece', { count: perk.requiredSetCount })}
                      </div>
                    </>
                  }
                  icon={<SetPerkIcon perkDef={perkDef} active={selected(perk, set.hash)} />}
                  onClick={handlePerkClick(set.hash, perk.requiredSetCount)}
                >
                  {perkDef.displayProperties.description}
                </TileGridTile>
              );
            })}
          </TileGrid>
        ))}
      </div>
    </Sheet>
  );
}

function Footer({
  setBonuses,
  onSubmit,
}: {
  setBonuses: SetBonusCounts;
  onSubmit: (event: React.FormEvent | KeyboardEvent) => void;
}) {
  const acceptButtonText = t('LB.SelectSetBonus');
  useHotkey('enter', acceptButtonText, onSubmit);
  const isPhonePortrait = useIsPhonePortrait();

  return (
    <div className={styles.footer}>
      <button type="button" className={styles.submitButton} onClick={onSubmit}>
        {!isPhonePortrait && '⏎ '}
        {acceptButtonText}
      </button>
      <SheetHorizontalScrollContainer className={styles.selectedBonuses}>
        <SetBonusDisplay setBonuses={setBonuses} />
      </SheetHorizontalScrollContainer>
    </div>
  );
}

function SetBonusDisplay({ setBonuses }: { setBonuses: SetBonusCounts }) {
  const defs = useD2Definitions()!;
  return Object.keys(setBonuses).map((setHash) => {
    const setDef = defs.EquipableItemSet.get(Number(setHash));
    return (
      setDef &&
      !setDef.redacted && (
        <SetBonus key={setDef.hash} setBonus={setDef} setCount={setBonuses[Number(setHash)]} />
      )
    );
  });
}
