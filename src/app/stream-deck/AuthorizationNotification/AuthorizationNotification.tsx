import { t } from 'app/i18next-t';
import { showNotification } from 'app/notifications/notifications';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import { sendToStreamDeck } from 'app/stream-deck/async-module';
import { notificationPromise } from 'app/stream-deck/msg-handlers';
import { setStreamDeckToken } from 'app/stream-deck/util/local-storage';
import styles from './AuthorizationNotification.m.scss';

interface StreamDeckChallengeProps {
  code: string;
}

export const randomStringToken = () => Math.random().toString(36).slice(2);

function StreamDeckChallenge({ code }: StreamDeckChallengeProps) {
  const dispatch = useThunkDispatch();
  return (
    <div>
      <div className={styles.authorizationChallenge}>
        <span>{t('StreamDeck.Authorization.Title')}</span>
        <div>{code}</div>
      </div>
      <div className={styles.confirmButtons}>
        <button
          type="button"
          className="dim-button"
          onClick={async () => {
            const token = randomStringToken();
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
export function showStreamDeckAuthorizationNotification(code: string) {
  showNotification({
    title: `Elgato Stream Deck`,
    body: <StreamDeckChallenge code={code} />,
    type: 'progress',
    duration: 200,
    promise: notificationPromise.promise,
  });
}
