import KeyHelp from 'app/dim-ui/KeyHelp';
import { t } from 'app/i18next-t';
import _ from 'lodash';
import React, { useState } from 'react';
import GlobalHotkeys from './GlobalHotkeys';
import hotkeys from './hotkeys';
import styles from './HotkeysCheatSheet.m.scss';
import { useHotkey } from './useHotkey';

export default function HotkeysCheatSheet() {
  const [visible, setVisible] = useState(false);

  const toggle = () => setVisible((visible) => !visible);

  const hide = () => setVisible(false);

  useHotkey('?', t('Hotkey.ShowHotkeys'), toggle);

  if (!visible) {
    return null;
  }

  const appKeyMap = hotkeys.getAllHotkeys();

  return (
    <div className={styles.container} onClick={hide}>
      <GlobalHotkeys
        hotkeys={[
          {
            combo: 'esc',
            description: '',
            callback: hide,
          },
        ]}
      />
      <div className={styles.hotkeys}>
        <h4 className={styles.title}>{t('Hotkey.CheatSheetTitle')}</h4>
        <div className={styles.list}>
          {_.sortBy(Object.entries(appKeyMap), ([combo]) => combo).map(
            ([combo, description]) =>
              description.length > 0 && (
                <React.Fragment key={combo}>
                  <div className={styles.keys}>
                    <KeyHelp combo={combo} className={styles.key} />
                  </div>
                  <div className={styles.text}>{description}</div>
                </React.Fragment>
              )
          )}
        </div>
      </div>
    </div>
  );
}
