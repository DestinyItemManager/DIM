import { PressTip, Tooltip } from 'app/dim-ui/PressTip';
import { t } from 'app/i18next-t';
import { DimStore } from 'app/inventory/store-types';
import { useCurrentSetBonus } from 'app/inventory/store/hooks';
import { ContributingArmor, SetPerkIcon } from 'app/item-popup/SetBonus';
import React from 'react';

export function CharacterSetBonus({ store }: { store: DimStore }) {
  const setBonusStatus = useCurrentSetBonus(store.id);
  const tooltip = (
    <>
      <Tooltip.Header text="set bonuses" />
      {Object.values(setBonusStatus.activeSetBonuses).map((sb) => (
        <React.Fragment key={sb!.setBonus.hash}>
          <span>{sb!.setBonus.displayProperties.name}</span>
          {Object.values(sb!.activePerks).map((p) => (
            <React.Fragment key={p.def.hash}>
              <span>{`${p.def.displayProperties.name} | ${t('Item.SetBonus.NPiece', { count: p.requirement })}`}</span>
              {p.def.displayProperties.description}
            </React.Fragment>
          ))}
          {store && <ContributingArmor store={store} setBonus={sb!.setBonus} showEquipped={true} />}
        </React.Fragment>
      ))}
    </>
  );
  return (
    <PressTip tooltip={tooltip} placement="top">
      {Object.values(setBonusStatus.activeSetBonuses).map((sb) => (
        <React.Fragment key={sb!.setBonus.hash}>
          {Object.values(sb!.activePerks).map((p) => (
            <SetPerkIcon key={p.def.hash} perkDef={p.def} active={true} />
          ))}
        </React.Fragment>
      ))}
    </PressTip>
  );
}
