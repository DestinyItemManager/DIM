import { t } from 'app/i18next-t';
import { AppIcon, banIcon } from 'app/shell/icons';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import streamDeckIcon from 'images/streamDeck.svg';
import { useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useSearchParams } from 'react-router';
import { streamDeckSetup } from '../actions';
import { streamDeckSelector } from '../selectors';
import StreamDeckPopover from '../StreamDeckPopover';
import * as styles from './StreamDeckButton.m.scss';

export default function StreamDeckButton() {
  const { enabled, connected, setupOpen, approvalRequired, checking } =
    useSelector(streamDeckSelector);
  const dispatch = useThunkDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const closeSetup = useCallback(() => {
    dispatch(streamDeckSetup(false));
    if (searchParams.get('streamdeck') === 'setup') {
      const params = new URLSearchParams(searchParams);
      params.delete('streamdeck');
      setSearchParams(params, { replace: true });
    }
  }, [dispatch, searchParams, setSearchParams]);

  return (
    <>
      {enabled && (
        <button
          ref={buttonRef}
          onClick={() => dispatch(streamDeckSetup(!setupOpen))}
          aria-expanded={setupOpen}
          aria-haspopup="dialog"
          aria-controls={setupOpen ? 'stream-deck-setup' : undefined}
          type="button"
          className={styles.streamDeckButton}
          title={t('StreamDeck.Tooltip.Title')}
        >
          <img src={streamDeckIcon} alt="" />
          <div
            className={
              checking
                ? styles.checking
                : connected && !approvalRequired
                  ? styles.connected
                  : styles.error
            }
          >
            {!checking && (!connected || approvalRequired) && <AppIcon icon={banIcon} />}
          </div>
        </button>
      )}
      {setupOpen && <StreamDeckPopover onClose={closeSetup} triggerRef={buttonRef} />}
    </>
  );
}
