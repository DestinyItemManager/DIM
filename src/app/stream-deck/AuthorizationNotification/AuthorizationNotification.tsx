import { t } from 'app/i18next-t';
import { showNotification } from 'app/notifications/notifications';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import { sendToStreamDeck } from 'app/stream-deck/async-module';
import { notificationPromise } from 'app/stream-deck/msg-handlers';
import { setStreamDeckToken } from 'app/stream-deck/util/local-storage';
import styles from './AuthorizationNotification.m.scss';

interface StreamDeckChallengeProps {
  mnemonic: string;
}

function StreamDeckChallenge({ mnemonic }: StreamDeckChallengeProps) {
  const dispatch = useThunkDispatch();
  return (
    <div>
      <div className={styles.authorizationChallenge}>
        <span>{t('StreamDeck.Authorization.Title')}</span>
        <div>{mnemonic}</div>
      </div>
      <div className={styles.confirmButtons}>
        <button
          type="button"
          className="dim-button"
          onClick={async () => {
            const token = 'token';
            setStreamDeckToken(token);
            await dispatch(
              sendToStreamDeck({
                action: 'authorization:confirm',
                data: {
                  token,
                },
              })
            );
          }}
        >
          {t('StreamDeck.Authorization.Yes')}
        </button>
        <button type="button" className="dim-button">
          {t('StreamDeck.Authorization.No')}
        </button>
      </div>
    </div>
  );
}

// Show notification asking for selection
export function showStreamDeckAuthorizationNotification(mnemonic: string) {
  showNotification({
    title: `Elgato Stream Deck`,
    body: <StreamDeckChallenge mnemonic={mnemonic} />,
    type: 'progress',
    duration: 200,
    promise: notificationPromise.promise,
  });
}
