import { InGameLoadoutIdentifiers } from '@destinyitemmanager/dim-api-types';
import ClosableContainer from 'app/dim-ui/ClosableContainer';
import { t } from 'app/i18next-t';
import { setInGameLoadoutIdentifiers } from 'app/loadout-drawer/loadout-drawer-reducer';
import { Loadout } from 'app/loadout/loadout-types';
import noInGameLoadoutIdentifiers from 'images/no-loadout-identifiers.svg';
import { useState } from 'react';
import EditInGameLoadoutIdentifiers from './EditInGameLoadoutIdentifiers';
import { InGameLoadoutIconFromIdentifiers } from './InGameLoadoutIcon';
import * as styles from './InGameLoadoutIdentifiersSelectButton.m.scss';

export default function InGameLoadoutIdentifiersSelectButton({
  loadout,
  setLoadout,
}: {
  loadout: Loadout;
  setLoadout: (f: (loadout: Loadout) => Loadout) => void;
}) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const identifiers = loadout.parameters?.inGameIdentifiers;

  let content = <img src={noInGameLoadoutIdentifiers} height={48} width={48} />;

  const handleClearIdentifiers = () => setLoadout(setInGameLoadoutIdentifiers(undefined));
  const handleChooseIdentifiers = (identifiers: InGameLoadoutIdentifiers) =>
    setLoadout(setInGameLoadoutIdentifiers(identifiers));

  if (identifiers) {
    content = <InGameLoadoutIconFromIdentifiers identifiers={identifiers} size={48} />;
  }

  return (
    <>
      <ClosableContainer onClose={identifiers ? handleClearIdentifiers : undefined}>
        <button
          className={styles.button}
          type="button"
          title={t('InGameLoadout.EditIdentifiers')}
          onClick={() => setSheetOpen(true)}
        >
          {content}
        </button>
      </ClosableContainer>
      {sheetOpen && (
        <EditInGameLoadoutIdentifiers
          identifiers={identifiers}
          onSave={handleChooseIdentifiers}
          onClose={() => setSheetOpen(false)}
        />
      )}
    </>
  );
}
