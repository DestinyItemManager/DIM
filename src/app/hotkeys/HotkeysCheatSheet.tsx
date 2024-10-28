import KeyHelp from 'app/dim-ui/KeyHelp';
import { t } from 'app/i18next-t';
import { compareBy } from 'app/utils/comparators';
import { Observable } from 'app/utils/observable';
import React, { memo } from 'react';
import { useSubscription } from 'use-subscription';
import GlobalHotkeys from './GlobalHotkeys';
import styles from './HotkeysCheatSheet.m.scss';
import { getAllHotkeys } from './hotkeys';
import { useHotkey } from './useHotkey';

export const showCheatSheet$ = new Observable(false);

export default memo(function HotkeysCheatSheet() {
  const visible = useSubscription(showCheatSheet$);

  const toggle = () => showCheatSheet$.next(!visible);

  const hide = () => showCheatSheet$.next(false);

  useHotkey('?', t('Hotkey.ShowHotkeys'), toggle);

  if (!visible) {
    return null;
  }

  const appKeyMap = getAllHotkeys();

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
          {Object.entries(appKeyMap)
            .sort(compareBy(([combo]) => combo))
            .map(
              ([combo, description]) =>
                description.length > 0 && (
                  <React.Fragment key={combo}>
                    <div className={styles.keys}>
                      <KeyHelp combo={combo} className={styles.key} />
                    </div>
                    <div className={styles.text}>{description}</div>
                  </React.Fragment>
                ),
            )}
        </div>
      </div>
    </div>
  );
});
