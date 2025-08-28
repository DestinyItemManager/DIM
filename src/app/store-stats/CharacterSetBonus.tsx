import { PressTip, Tooltip } from 'app/dim-ui/PressTip';
import { t } from 'app/i18next-t';
import { DimStore } from 'app/inventory/store-types';
import { useCurrentSetBonus } from 'app/inventory/store/hooks';
import { ContributingArmor, SetPerkIcon } from 'app/item-popup/SetBonus';
import React from 'react';

export function CharacterSetBonus({ store }: { store: DimStore }) {
  const setBonusStatus = useCurrentSetBonus(store.id);
  return (
    <div>
      {Object.values(setBonusStatus.activeSetBonuses).map((sb) => (
        <PressTip
          key={sb!.setBonus.hash}
          tooltip={
            <>
              <Tooltip.Header text={sb!.setBonus.displayProperties.name} />
              {Object.values(sb!.activePerks).map((p) => (
                <React.Fragment key={p.def.hash}>
                  <strong>{`${t('Item.SetBonus.NPiece', { count: p.requirement })} | ${p.def.displayProperties.name}`}</strong>
                  <br />
                  {p.def.displayProperties.description}
                  <hr />
                </React.Fragment>
              ))}
              {store && (
                <ContributingArmor store={store} setBonus={sb!.setBonus} showEquipped={true} />
              )}
            </>
          }
          placement="top"
        >
          {Object.values(sb!.activePerks).map((p) => (
            <SetPerkIcon key={p.def.hash} perkDef={p.def} active={true} />
          ))}
        </PressTip>
      ))}
    </div>
  );
}
