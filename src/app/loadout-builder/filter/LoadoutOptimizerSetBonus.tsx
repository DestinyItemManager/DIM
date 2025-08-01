import BungieImage from 'app/dim-ui/BungieImage';
import Sheet from 'app/dim-ui/Sheet';
import { TileGrid, TileGridTile } from 'app/dim-ui/TileGrid';
import { t } from 'app/i18next-t';
import { SetBonus } from 'app/item-popup/SetBonus';
import LoadoutEditSection from 'app/loadout/loadout-edit/LoadoutEditSection';
import { useD2Definitions } from 'app/manifest/selectors';
import { objectValues } from 'app/utils/util-types';
import { DestinyItemSetPerkDefinition } from 'bungie-api-ts/destiny2';
import { sum } from 'es-toolkit';
import { Dispatch, memo, useState } from 'react';
import { LoadoutBuilderAction } from '../loadout-builder-reducer';
import { SetBonusCounts } from '../types';
import styles from './LoadoutOptimizerSetBonus.m.scss';

const LoadoutOptimizerSetBonus = memo(function LoadoutOptimizerSetBonus({
  setBonuses,
  lbDispatch,
  className,
}: {
  setBonuses: SetBonusCounts;
  lbDispatch: Dispatch<LoadoutBuilderAction>;
  className?: string;
}) {
  const [showSetBonusPicker, setShowSetBonusPicker] = useState(false);
  const handleClear = () => {
    lbDispatch({ type: 'removeSetBonuses' });
  };

  const handleClickEdit = () => setShowSetBonusPicker(true);

  return (
    <LoadoutEditSection
      title={t('LoadoutBuilder.SetBonus')}
      className={className}
      onClear={handleClear}
    >
      <ChosenSetBonusOption setBonuses={setBonuses} onClick={handleClickEdit} />
      <button type="button" className="dim-button" onClick={handleClickEdit}>
        {t('LB.SelectSetBonus')}
      </button>
      {showSetBonusPicker && (
        <SetBonusPicker
          setBonuses={setBonuses}
          onAccept={(setBonuses) => lbDispatch({ type: 'setSetBonuses', setBonuses })}
          onClose={() => setShowSetBonusPicker(false)}
        />
      )}
    </LoadoutEditSection>
  );
});

export default LoadoutOptimizerSetBonus;

function ChosenSetBonusOption({
  setBonuses,
  onClick,
}: {
  setBonuses: SetBonusCounts;
  onClick: () => void;
}) {
  const defs = useD2Definitions()!;
  // const itemCreationContext = useSelector(createItemContextSelector);

  // let info: { icon: React.ReactNode; title: React.ReactNode; description: React.ReactNode };

  return Object.keys(setBonuses).map((setHash) => {
    const setDef = defs.EquipableItemSet.get(Number(setHash));
    return (
      setDef &&
      !setDef.redacted &&
      SetBonus({
        setBonus: setDef,
        setCount: setBonuses[Number(setHash)] || 0,
        defs,
      })
    );
  });
}

export function SetBonusPicker({
  setBonuses,
  onAccept,
  onClose,
}: {
  /** Set bonus hashes mapped to desired item counts. */
  setBonuses: SetBonusCounts;
  /** Called with the complete list of lockedMods when the user accepts the new mod selections. */
  onAccept: (newSetBonuses: SetBonusCounts) => void;
  /** Called when the user accepts the new modset of closes the sheet. */
  onClose: () => void;
}) {
  const defs = useD2Definitions()!;
  // const language = useSelector(languageSelector);
  // const [query, setQuery] = useState('');

  const sets = objectValues(defs.EquipableItemSet.getAll()).filter((set) => !set.redacted);

  const selected = (perk: DestinyItemSetPerkDefinition, setHash: number) =>
    (setBonuses[setHash] || 0) >= perk.requiredSetCount;
  const disabled = (perk: DestinyItemSetPerkDefinition, setHash: number) =>
    !selected(perk, setHash) &&
    sum(Object.values(setBonuses)) - (setBonuses[setHash] || 0) + perk.requiredSetCount > 5;

  return (
    <Sheet
      header={
        <div>
          <h1>{t('LB.ChooseASetBonus')}</h1>
          {/* <SearchInput
            query={query}
            onQueryChanged={setQuery}
            placeholder={t('LB.SearchAnExotic')}
            autoFocus
          /> */}
        </div>
      }
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
                  title={perkDef.displayProperties.name}
                  icon={
                    <>
                      <div className={styles.perkIcon} title={perkDef.displayProperties.name}>
                        <BungieImage src={perkDef.displayProperties.icon} />
                      </div>
                    </>
                  }
                  onClick={() =>
                    onAccept({
                      ...setBonuses,
                      [set.hash]:
                        (setBonuses[set.hash] || 0) === perk.requiredSetCount
                          ? 0
                          : perk.requiredSetCount,
                    })
                  }
                >
                  {t('Item.SetBonus.NPiece', { count: perk.requiredSetCount })}
                  <br />
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
