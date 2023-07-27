import HelpLink from 'app/dim-ui/HelpLink';
import useDialog, { Body, Buttons, Title } from 'app/dim-ui/useDialog';
import { t } from 'app/i18next-t';
import { userGuideUrl } from 'app/shell/links';
import { isWindows } from 'app/utils/browsers';
import _ from 'lodash';
import React, { useCallback, useMemo, useState } from 'react';
import styles from './LoadoutPopupRandomize.m.scss';

export interface RandomizeCheckboxes {
  subclass: boolean;
  weapons: boolean;
  armor: boolean;
  general: boolean;
  mods: boolean;
}

/** Persist these in a browser session. Maybe store in DIM Sync instead? */
let lastOptions: RandomizeCheckboxes = {
  weapons: true,
  armor: false,
  general: false,
  mods: false,
  subclass: false,
};

export function useRandomizeLoadout(): [
  element: React.ReactNode,
  getRandomizeOptions: (args: {
    query: string;
    d2: boolean;
  }) => Promise<RandomizeCheckboxes | null>,
] {
  const [dialog, showDialog] = useDialog<
    { query: string; d2: boolean },
    RandomizeCheckboxes | null
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
  close: (result: RandomizeCheckboxes | null) => void;
}) {
  const [options, setOptions] = useState({ ...lastOptions, mods: d2 && lastOptions.mods });

  const cancel = useCallback(() => close(null), [close]);
  const ok = useCallback(() => {
    lastOptions = options;
    close(options);
  }, [close, options]);

  const checkBoxes: { label: string; prop: keyof RandomizeCheckboxes }[] = useMemo(
    () =>
      _.compact([
        { label: t('Bucket.Weapons'), prop: 'weapons' },
        { label: t('Bucket.Armor'), prop: 'armor' },
        { label: t('Bucket.General'), prop: 'general' },
        d2 && { label: t('Loadouts.Mods'), prop: 'mods' },
        { label: 'Subclass', prop: 'subclass' },
      ]),
    [d2]
  );

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
        {checkBoxes.map(({ prop, label }) => (
          <React.Fragment key={prop}>
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
          </React.Fragment>
        ))}
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
