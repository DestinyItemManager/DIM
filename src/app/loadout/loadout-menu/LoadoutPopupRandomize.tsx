import HelpLink from 'app/dim-ui/HelpLink';
import useDialog, { Body, Buttons, Title } from 'app/dim-ui/useDialog';
import { t } from 'app/i18next-t';
import { userGuideUrl } from 'app/shell/links';
import { isWindows } from 'app/utils/browsers';
import React, { useCallback, useState } from 'react';
import * as styles from './LoadoutPopupRandomize.m.scss';

export interface RandomLoadoutOptions {
  subclass: boolean;
  weapons: boolean;
  armor: boolean;
  general: boolean;
  mods: boolean;
}

/** Persist these in a browser session. Maybe store in DIM Sync instead? */
let lastOptions: RandomLoadoutOptions = {
  weapons: true,
  armor: false,
  general: false,
  mods: false,
  subclass: false,
};

const checkBoxes: { label: string; d2Only?: boolean; prop: keyof RandomLoadoutOptions }[] = [
  { label: t('Bucket.Class'), prop: 'subclass' },
  { label: t('Bucket.Weapons'), prop: 'weapons' },
  { label: t('Bucket.Armor'), prop: 'armor' },
  { label: t('Bucket.General'), prop: 'general' },
  { label: t('Loadouts.Mods'), prop: 'mods', d2Only: true },
];

export function useRandomizeLoadout(): [
  element: React.ReactNode,
  getRandomizeOptions: (args: {
    query: string;
    d2: boolean;
  }) => Promise<RandomLoadoutOptions | null>,
] {
  const [dialog, showDialog] = useDialog<
    { query: string; d2: boolean },
    RandomLoadoutOptions | null
  >(({ query, d2 }, close) => <RandomizeLoadoutDialog d2={d2} query={query} close={close} />);

  return [dialog, showDialog];
}

function RandomizeLoadoutDialog({
  d2,
  query,
  close,
}: {
  d2: boolean;
  query: string;
  close: (result: RandomLoadoutOptions | null) => void;
}) {
  const [options, setOptions] = useState({ ...lastOptions, mods: d2 && lastOptions.mods });

  const cancel = useCallback(() => close(null), [close]);
  const ok = useCallback(() => {
    lastOptions = options;
    close(options);
  }, [close, options]);

  const okButton = (
    <button
      className="dim-button dim-button-primary"
      type="button"
      onClick={ok}
      disabled={!checkBoxes.some(({ prop }) => options[prop])}
    >
      {query.length > 0 ? t('Loadouts.RandomizeSearch') : t('Loadouts.Randomize')}
    </button>
  );

  const cancelButton = (
    <button className="dim-button" type="button" onClick={cancel}>
      {t('Dialog.Cancel')}
    </button>
  );

  const description =
    query.length > 0 ? (
      <p>{t('Loadouts.RandomizeSearchPrompt', { query })}</p>
    ) : (
      <>
        <p className={styles.hint}>
          {t('Loadouts.RandomizeQueryHint')}{' '}
          <HelpLink helpLink={userGuideUrl('Randomize-Loadout')} />
        </p>
      </>
    );

  return (
    <>
      <Title>
        <h2>{t('Loadouts.Randomize')}</h2>
      </Title>
      <Body>
        {checkBoxes.map(
          ({ prop, label, d2Only }) =>
            (!d2Only || d2) && (
              <React.Fragment key={prop}>
                <div className={styles.checkboxRow}>
                  <input
                    name={prop}
                    type="checkbox"
                    checked={options[prop]}
                    onChange={(event) =>
                      setOptions((oldOptions) => ({ ...oldOptions, [prop]: event.target.checked }))
                    }
                  />
                  <label htmlFor={prop} title={t('FarmingMode.MakeRoom.Tooltip')}>
                    {label}
                  </label>
                </div>
                <br />
              </React.Fragment>
            ),
        )}
        {description}
      </Body>
      <Buttons>
        {isWindows() ? (
          <>
            {cancelButton}
            {okButton}
          </>
        ) : (
          <>
            {okButton}
            {cancelButton}
          </>
        )}
      </Buttons>
    </>
  );
}
