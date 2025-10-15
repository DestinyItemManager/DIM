import { PressTip } from 'app/dim-ui/PressTip';
import { t } from 'app/i18next-t';
import { AppIcon, banIcon } from 'app/shell/icons';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import streamDeckIcon from 'images/streamDeck.svg';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { streamDeckSelector } from '../selectors';
import { streamDeckAuthorizationInit } from '../util/authorization';
import { STREAM_DECK_MINIMUM_VERSION, checkStreamDeckVersion } from '../util/version';
import * as styles from './StreamDeckButton.m.scss';

function StreamDeckTooltip({
  version,
  error,
  needSetup,
}: {
  version?: string;
  error?: boolean;
  needSetup?: boolean;
}) {
  return (
    <div>
      <div className={styles.tooltipTitle}>{t('StreamDeck.Tooltip.Title')}</div>
      {error ? (
        <>
          <p>{t('StreamDeck.Tooltip.Error')}</p>
          <table className={styles.versionTable}>
            <tbody>
              <tr>
                <td>{t('StreamDeck.Tooltip.Application')}</td>
                <td>6.5</td>
              </tr>
              <tr>
                <td>{t('StreamDeck.Tooltip.Plugin')}</td>
                <td>{STREAM_DECK_MINIMUM_VERSION}</td>
              </tr>
            </tbody>
          </table>
          <div className={styles.tooltipTitle}>{t('StreamDeck.Tooltip.ExtensionIssue')}</div>
          <p>{t('StreamDeck.Tooltip.ErrorConnection')}</p>
        </>
      ) : (
        <p>
          {needSetup ? (
            t('StreamDeck.Tooltip.AuthRequired')
          ) : (
            <>
              <strong>{t('StreamDeck.Tooltip.Version')}</strong> {version}
            </>
          )}
        </p>
      )}
    </div>
  );
}

export default function StreamDeckButton() {
  const { connected, auth } = useSelector(streamDeckSelector);
  const [version, setVersion] = useState<string | undefined>(undefined);

  const updateVersion = async () => {
    try {
      const resp = await fetch('http://localhost:9120/version', {
        mode: 'cors',
      });
      const text = await resp.text();
      setVersion(text);
    } catch {
      setVersion(undefined);
    }
  };

  useEffect(() => {
    updateVersion();
  }, []);

  const error = !checkStreamDeckVersion(version);
  const needSetup = auth === undefined;
  const dispatch = useThunkDispatch();

  return (
    <PressTip tooltip={<StreamDeckTooltip version={version} error={error} needSetup={needSetup} />}>
      <button
        onClick={() => {
          updateVersion();
          needSetup && dispatch(streamDeckAuthorizationInit());
        }}
        type="button"
        className={styles.streamDeckButton}
        title={t('StreamDeck.Tooltip.Title')}
      >
        <img src={streamDeckIcon} />
        {error ? (
          <div className={styles.error}>
            <AppIcon icon={banIcon} />
          </div>
        ) : (
          connected && !needSetup && <div className={styles.connected} />
        )}
      </button>
    </PressTip>
  );
}
