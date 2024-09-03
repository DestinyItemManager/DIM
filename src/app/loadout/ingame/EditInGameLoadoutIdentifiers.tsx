import { InGameLoadoutIdentifiers } from '@destinyitemmanager/dim-api-types';
import Sheet, { SheetContent } from 'app/dim-ui/Sheet';
import { t } from 'app/i18next-t';
import { useD2Definitions } from 'app/manifest/selectors';
import { useState } from 'react';
import styles from './EditInGameLoadoutIdentifiers.m.scss';
import SelectInGameLoadoutIdentifiers, {
  useIdentifierValues,
} from './SelectInGameLoadoutIdentifiers';

/** An editor sheet for just editing the name/color/icon */
export default function EditInGameLoadoutIdentifiers({
  identifiers,
  onSave,
  onClose,
}: {
  identifiers: InGameLoadoutIdentifiers | undefined;
  onSave: (updated: InGameLoadoutIdentifiers) => void;
  onClose: () => void;
}) {
  const defs = useD2Definitions()!;

  const [names, colors, icons] = useIdentifierValues(defs);
  const defaultName = names[0].hash;
  const defaultColor = colors[0].hash;
  const defaultIcon = icons[0].hash;

  const [nameHash, setNameHash] = useState(identifiers?.nameHash ?? defaultName);
  const [colorHash, setColorHash] = useState(identifiers?.colorHash ?? defaultColor);
  const [iconHash, setIconHash] = useState(identifiers?.iconHash ?? defaultIcon);

  const handleSave = (onClose: () => void) => (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ nameHash, colorHash, iconHash });
    onClose();
  };

  const footer: SheetContent = ({ onClose }) => (
    <form onSubmit={handleSave(onClose)}>
      <button type="submit" className="dim-button">
        {t('InGameLoadout.SaveIdentifiers')}
      </button>
    </form>
  );

  return (
    <Sheet
      onClose={onClose}
      footer={footer}
      header={<h1 className={styles.header}>{t('InGameLoadout.EditIdentifiers')}</h1>}
    >
      <div className={styles.content}>
        <SelectInGameLoadoutIdentifiers
          nameHash={nameHash}
          colorHash={colorHash}
          iconHash={iconHash}
          onNameHashChanged={setNameHash}
          onColorHashChanged={setColorHash}
          onIconHashChanged={setIconHash}
        />
      </div>
    </Sheet>
  );
}
