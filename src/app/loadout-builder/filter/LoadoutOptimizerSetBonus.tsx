import BungieImage from 'app/dim-ui/BungieImage';
import Sheet from 'app/dim-ui/Sheet';
import { SheetHorizontalScrollContainer } from 'app/dim-ui/SheetHorizontalScrollContainer';
import { TileGrid, TileGridTile } from 'app/dim-ui/TileGrid';
import { useHotkey } from 'app/hotkeys/useHotkey';
import { t } from 'app/i18next-t';
import { SetBonus } from 'app/item-popup/SetBonus';
import LoadoutEditSection from 'app/loadout/loadout-edit/LoadoutEditSection';
import { useD2Definitions } from 'app/manifest/selectors';
import { useIsPhonePortrait } from 'app/shell/selectors';
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
          initialSetBonuses={setBonuses}
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
  return (
    <div className={styles.chosenSetBonus} onClick={onClick}>
      {SetBonusDisplay({ setBonuses })}
    </div>
  );
}

export function SetBonusPicker({
  initialSetBonuses,
  onAccept,
  onClose,
}: {
  /** Initial Set bonus hashes mapped to desired item counts. */
  initialSetBonuses: SetBonusCounts;
  /** Called with the new SetBonusCounts when the user accepts the new selections. */
  onAccept: (setBonuses: SetBonusCounts) => void;
  /** Called when the user accepts the new perk set or closes the sheet. */
  onClose: () => void;
}) {
  const defs = useD2Definitions()!;
  const isPhonePortrait = useIsPhonePortrait();

  // TODO search functionality
  // const language = useSelector(languageSelector);
  // const [query, setQuery] = useState('');
  const [setBonuses, setSetBonuses] = useState(initialSetBonuses);

  const sets = objectValues(defs.EquipableItemSet.getAll()).filter((set) => !set.redacted);

  const selected = (perk: DestinyItemSetPerkDefinition, setHash: number) =>
    (setBonuses[setHash] || 0) >= perk.requiredSetCount;
  const disabled = (perk: DestinyItemSetPerkDefinition, setHash: number) =>
    !selected(perk, setHash) &&
    sum(Object.values(setBonuses)) - (setBonuses[setHash] || 0) + perk.requiredSetCount > 5;

  const footer = ({ onClose }: { onClose: () => void }) => (
    <Footer
      isPhonePortrait={isPhonePortrait}
      acceptButtonText={t('LB.SelectSetBonus')}
      setBonuses={setBonuses}
      onSubmit={(event) => {
        event.preventDefault();
        onAccept(setBonuses);
        onClose();
      }}
    />
  );

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
                  title={perkDef.displayProperties.name}
                  icon={
                    <>
                      <div className={styles.perkIcon} title={perkDef.displayProperties.name}>
                        <BungieImage src={perkDef.displayProperties.icon} />
                      </div>
                    </>
                  }
                  onClick={() => {
                    setSetBonuses({
                      ...setBonuses,
                      [set.hash]:
                        (setBonuses[set.hash] || 0) === perk.requiredSetCount
                          ? 0
                          : perk.requiredSetCount,
                    });
                  }}
                >
                  <span className={styles.setCount}>
                    {t('Item.SetBonus.NPiece', { count: perk.requiredSetCount })}
                  </span>
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
  isPhonePortrait,
  acceptButtonText,
  setBonuses,
  onSubmit,
}: {
  isPhonePortrait: boolean;
  acceptButtonText: string;
  setBonuses: SetBonusCounts;
  onSubmit: (event: React.FormEvent | KeyboardEvent) => void;
}) {
  useHotkey('enter', acceptButtonText, onSubmit);

  return (
    <div className={styles.footer}>
      <button type="button" className={styles.submitButton} onClick={onSubmit}>
        {!isPhonePortrait && '⏎ '}
        {acceptButtonText}
      </button>
      <SheetHorizontalScrollContainer className={styles.selectedBonuses}>
        {SetBonusDisplay({ setBonuses })}
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
      !setDef.redacted &&
      SetBonus({
        setBonus: setDef,
        setCount: setBonuses[Number(setHash)] || 0,
        defs,
      })
    );
  });
}
