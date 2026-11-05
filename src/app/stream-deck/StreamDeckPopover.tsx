import ClickOutside from 'app/dim-ui/ClickOutside';
import ExternalLink from 'app/dim-ui/ExternalLink';
import { usePopper } from 'app/dim-ui/usePopper';
import { useHotkey } from 'app/hotkeys/useHotkey';
import { t } from 'app/i18next-t';
import { showNotification } from 'app/notifications/notifications';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import { Portal } from 'app/utils/temp-container';
import { RefObject, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { streamDeckEnabled } from './actions';
import { streamDeckSelector } from './selectors';
import { lazyLoadStreamDeck } from './stream-deck';
import { streamDeckAuthorizationInit } from './util/authorization';
import { checkStreamDeckVersion, STREAM_DECK_MINIMUM_VERSION } from './util/version';

import * as styles from './StreamDeckPopover.m.scss';

export default function StreamDeckPopover({
  onClose,
  triggerRef,
}: {
  onClose: () => void;
  triggerRef: RefObject<HTMLButtonElement | null>;
}) {
  const dispatch = useThunkDispatch();
  const connection = useSelector(streamDeckSelector);
  const { approvalRequired, checking } = connection;
  const connected = connection.connected && !approvalRequired && !checking;
  const [status, setStatus] = useState<'idle' | 'waiting' | 'unreachable' | 'outdated'>('idle');
  const [version, setVersion] = useState<string>();
  const [attempt, setAttempt] = useState(0);
  const popoverRef = useRef<HTMLDivElement>(null);
  usePopper(
    {
      contents: popoverRef,
      reference: triggerRef,
      arrowClassName: styles.arrow,
      placement: 'bottom-end',
      fixed: true,
    },
    [status, checking, approvalRequired],
  );
  useHotkey('esc', t('Hotkey.ClearDialog'), onClose);

  useLayoutEffect(() => {
    const popover = popoverRef.current;
    const trigger = triggerRef.current;
    popover?.focus();
    return () => {
      if (popover?.contains(document.activeElement)) {
        trigger?.focus();
      }
    };
  }, [triggerRef]);

  useEffect(() => {
    if (connected) {
      onClose();
    } else if (status === 'unreachable' || status === 'outdated') {
      showNotification({
        type: 'error',
        title: t('StreamDeck.Error.Title'),
        body:
          status === 'outdated'
            ? t('StreamDeck.Setup.outdated', {
                version: version ?? '',
                minimum: STREAM_DECK_MINIMUM_VERSION,
              })
            : `${t('StreamDeck.Setup.unreachable')} ${t('StreamDeck.Setup.Help')}`,
        duration: 10000,
      });
      onClose();
    }
  }, [connected, status, version, onClose]);

  // Prepare the module before the click so opening Stream Deck retains the browser's user gesture.
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let active = true;
    lazyLoadStreamDeck()
      .then(() => active && setReady(true))
      .catch(() => {
        if (active) {
          setStatus('unreachable');
        }
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!attempt || connection.connected) {
      return;
    }
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 5000);
    fetch('http://localhost:9120/version', { mode: 'cors', signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error('Plugin unavailable');
        }
        const detected = (await response.text()).trim();
        if (!controller.signal.aborted) {
          setVersion(detected);
          setStatus(checkStreamDeckVersion(detected) ? 'waiting' : 'outdated');
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setStatus('unreachable');
        }
      });
    const waiting = window.setTimeout(
      () => setStatus((current) => (current === 'waiting' ? 'unreachable' : current)),
      8000,
    );
    return () => {
      controller.abort();
      window.clearTimeout(timeout);
      window.clearTimeout(waiting);
    };
  }, [attempt, connection.connected]);

  const connect = () => {
    dispatch(streamDeckEnabled(true));
    dispatch(streamDeckAuthorizationInit());
    setStatus('waiting');
    setAttempt((value) => value + 1);
  };

  if (connected) {
    return null;
  }

  return (
    <Portal>
      <ClickOutside
        ref={popoverRef}
        extraRef={triggerRef}
        onClickOutside={onClose}
        id="stream-deck-setup"
        role="dialog"
        aria-labelledby="stream-deck-setup-title"
        tabIndex={-1}
        className={styles.popover}
      >
        <div className={styles.content}>
          <h2 id="stream-deck-setup-title">{t('StreamDeck.Setup.Title')}</h2>
          <ol>
            <li>{t('StreamDeck.Setup.OpenApp')}</li>
            <li>{t('StreamDeck.Setup.ConnectStep')}</li>
            <li>{t('StreamDeck.Setup.ApproveStep')}</li>
          </ol>
          <p role="status" aria-live="polite">
            {checking
              ? t('StreamDeck.Setup.Checking')
              : connection.connected && attempt
                ? t('StreamDeck.Setup.ConfirmApproval')
                : status === 'waiting'
                  ? t('StreamDeck.Setup.waiting')
                  : null}
          </p>
          <div className={styles.buttons}>
            <ExternalLink href="https://marketplace.elgato.com/product/dim-stream-deck-11883ba5-c8db-4e3a-915f-612c5ba1b2e4">
              {t('StreamDeck.Install')}
            </ExternalLink>
            <button
              type="button"
              className="dim-button dim-button-primary"
              onClick={connect}
              disabled={!ready}
            >
              {attempt ? t('StreamDeck.Setup.Retry') : t('StreamDeck.Setup.Connect')}
            </button>
          </div>
        </div>
        <div className={styles.arrow} />
      </ClickOutside>
    </Portal>
  );
}
