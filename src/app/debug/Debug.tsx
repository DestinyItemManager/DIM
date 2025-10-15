import Account from 'app/accounts/Account';
import { accountsSelector, currentAccountSelector } from 'app/accounts/selectors';
import { BungieError, HttpStatusError } from 'app/bungie-api/http-client';
import { Token, getToken } from 'app/bungie-api/oauth-tokens';
import { clarityCharacterStatsSelector, clarityDescriptionsSelector } from 'app/clarity/selectors';
import { DimAuthToken, getToken as getDimApiToken } from 'app/dim-api/dim-api-helper';
import {
  apiPermissionGrantedSelector,
  currentProfileSelector,
  dimSyncErrorSelector,
  settingSelector,
  updateQueueLengthSelector,
} from 'app/dim-api/selectors';
import { t } from 'app/i18next-t';
import { profileErrorSelector, profileResponseSelector } from 'app/inventory/selectors';
import { useLoadStores } from 'app/inventory/store/hooks';
import { TroubleshootingSettings } from 'app/settings/Troubleshooting';
import LocalStorageInfo from 'app/storage/LocalStorageInfo';
import { set } from 'app/storage/idb-keyval';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import { streamDeckSelector } from 'app/stream-deck/selectors';
import { DimError } from 'app/utils/dim-error';
import { convertToError } from 'app/utils/errors';
import { usePageTitle } from 'app/utils/hooks';
import { systemInfo } from 'app/utils/system-info';
import { wishListsLastFetchedSelector, wishListsSelector } from 'app/wishlists/selectors';
import { fetchWishList } from 'app/wishlists/wishlist-fetch';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import * as styles from './Debug.m.scss';

/**
 * A user-facing debug page that displays information about the DIM environment,
 * browser, and various states and capabilities to help us figure things out.
 *
 * The text on this page is for DIM developers and does not need to be translated.
 */
export default function Debug() {
  usePageTitle('Debug');
  const dispatch = useThunkDispatch();
  const bungieToken = getToken();
  const dimApiToken = getDimApiToken();

  const accounts = useSelector(accountsSelector);
  const currentAccount = useSelector(currentAccountSelector);
  const profileResponse = useSelector(profileResponseSelector);
  const profileError = useSelector(profileErrorSelector);
  const dimSyncProfile = useSelector(currentProfileSelector);
  const dimSyncError = useSelector(dimSyncErrorSelector);
  const dimSyncUpdateQueueSize = useSelector(updateQueueLengthSelector);
  const apiPermissionGranted = useSelector(apiPermissionGrantedSelector);
  const wishListsLastFetched = useSelector(wishListsLastFetchedSelector);
  const wishlistSource = useSelector(settingSelector('wishListSource'));
  const wishList = useSelector(wishListsSelector);
  const streamDeck = useSelector(streamDeckSelector);
  const clarityDescriptions = useSelector(clarityDescriptionsSelector);
  const clarityCharacterStats = useSelector(clarityCharacterStatsSelector);

  useLoadStores(currentAccount);

  const [localStorageError, setLocalStorageError] = useState<Error>();
  const [idbError, setIdbError] = useState<Error>();
  useEffect(() => {
    (async () => {
      try {
        await set('idb-test', true);
      } catch (e) {
        setIdbError(convertToError(e));
      }
    })();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('test', 'true');
    } catch (e) {
      setLocalStorageError(convertToError(e));
    }
  }, []);

  const [serviceWorkers, setServiceWorkers] = useState<readonly ServiceWorkerRegistration[]>([]);
  useEffect(() => {
    (async () => {
      setServiceWorkers(await navigator.serviceWorker.getRegistrations());
    })();
  }, []);

  const isD2 = currentAccount?.destinyVersion === 2;
  useEffect(() => {
    if ($featureFlags.wishLists && isD2) {
      dispatch(fetchWishList());
    }
  }, [dispatch, isD2]);

  const now = (
    <p>
      <b>Now:</b> {new Date().toISOString()}
    </p>
  );

  const weirdWishlistRoll = wishList?.wishListAndInfo?.wishListRolls.find(
    (r) => r.recommendedPerks && !(r.recommendedPerks instanceof Set),
  );

  // TODO: If these tiles get too complicated, they could be broken out into components
  return (
    <div className={styles.debugPage}>
      <p>
        Open the debug console (F12 or Ctrl + ⇧ Shift + J on Windows, ⌘ + ⌥ Option + J on macOS, ⌘ +
        ⌥ Option + C in Safari (after enabling it)), select the console tab, then send a screenshot
        of this entire page and the console.
      </p>
      <div className={styles.cells}>
        <section>
          <h3>Browser</h3>
          <p>
            {t('Views.About.Version', {
              version: $DIM_VERSION,
              flavor: $DIM_FLAVOR,
              date: new Date($DIM_BUILD_DATE).toLocaleString(),
            })}
          </p>
          <p>{systemInfo}</p>
          <p>
            <b>User Agent:</b> {navigator.userAgent}
          </p>
          <p>
            <b>navigator.platform:</b> {navigator.platform}
          </p>
        </section>

        <section>
          <h3>Auth Tokens</h3>
          {now}
          {bungieToken ? (
            <>
              <p>
                <b>Membership ID:</b> {bungieToken.bungieMembershipId}
              </p>
              {bungieToken.accessToken && <BungieTokenState token={bungieToken.accessToken} />}
              {bungieToken.refreshToken && <BungieTokenState token={bungieToken.refreshToken} />}
            </>
          ) : (
            <p>No auth token</p>
          )}
        </section>

        <section>
          <h3>DIM Sync Auth Tokens</h3>
          {now}
          {dimApiToken ? <DIMTokenState token={dimApiToken} /> : <p>No auth token</p>}
        </section>

        <section>
          <h3>Accounts</h3>
          {accounts.map((account) => (
            <div key={`${account.membershipId}-${account.destinyVersion}`}>
              <Account account={account} selected={account === currentAccount} />
              {account.membershipId}
            </div>
          ))}
        </section>

        <section>
          <h3>Storage</h3>
          <p>
            {localStorageError ? (
              <>
                <b>Local Storage Broken:</b> <ErrorInfo error={localStorageError} />
              </>
            ) : (
              <b>Local Storage Works</b>
            )}
          </p>
          <p>
            {idbError ? (
              <>
                <b>IDB Broken:</b> <ErrorInfo error={idbError} />
              </>
            ) : (
              <b>IDB Works</b>
            )}
          </p>
          <LocalStorageInfo showDetails />
        </section>

        <section>
          <h3>Profile Response</h3>
          {now}
          {profileResponse && (
            <p>
              <b>Minted:</b> {new Date(profileResponse?.responseMintedTimestamp).toISOString()}
            </p>
          )}
          <p>
            <b>Error:</b> {profileError ? <ErrorInfo error={profileError} /> : 'None'}
          </p>
        </section>

        <section>
          <h3>DIM Sync</h3>
          <p>
            <b>API Permission Granted:</b> {JSON.stringify(apiPermissionGranted)}
          </p>
          {now}
          {dimSyncProfile ? (
            <>
              <p>
                <b>Last Fetched:</b> {new Date(dimSyncProfile.profileLastLoaded).toISOString()}
              </p>
              <p>
                <b>Tags:</b> {Object.keys(dimSyncProfile.tags).length}
              </p>
              <p>
                <b>Loadouts:</b> {Object.keys(dimSyncProfile.loadouts).length}
              </p>
            </>
          ) : (
            <p>No Profile Loaded</p>
          )}
          <p>
            <b>Update Queue Size:</b> {dimSyncUpdateQueueSize}
          </p>
          <p>
            <b>Error:</b> {dimSyncError ? <ErrorInfo error={dimSyncError} /> : 'None'}
          </p>
        </section>

        <section>
          <h3>Service Worker</h3>
          {serviceWorkers.length > 0 ? (
            serviceWorkers.map((w, i) => (
              <div key={i}>
                {i}: Active: {w.active?.state || 'null'}, Waiting: {w.waiting?.state || 'null'},
                Installing: {w.installing?.state || 'null'}
              </div>
            ))
          ) : (
            <div>Service worker not installed</div>
          )}
        </section>

        <section>
          <h3>Wish Lists</h3>
          <p>
            <b>Source:</b> {wishlistSource}
          </p>
          <p>
            <b>Last Fetched:</b> {wishListsLastFetched?.toISOString() ?? 'Never'}
          </p>
          <p>
            <b>Wish list rolls:</b>{' '}
            {wishList?.wishListAndInfo?.wishListRolls.length.toLocaleString() ?? 'No wishlist'}
          </p>
          <p>
            <b>Weird recommendedPerks?:</b>{' '}
            {weirdWishlistRoll ? typeof weirdWishlistRoll.recommendedPerks : 'All good'}
          </p>
        </section>

        <section>
          <h3>Clarity</h3>
          <p>
            <b>Descriptions loaded?:</b> {JSON.stringify(Boolean(clarityDescriptions))}
          </p>
          <p>
            <b>Character stats loaded?:</b> {JSON.stringify(Boolean(clarityCharacterStats))}
          </p>
        </section>

        {$featureFlags.elgatoStreamDeck && (
          <section>
            <h3>Stream Deck</h3>
            <p>
              <b>Enabled:</b> {JSON.stringify(Boolean(streamDeck.enabled))}
            </p>
            <p>
              <b>Connected:</b> {JSON.stringify(streamDeck.connected)}
            </p>
            <p>
              <b>Instance:</b> {JSON.stringify(streamDeck.auth?.instance) ?? '-'}
            </p>
            <p>
              <b>Token:</b> {JSON.stringify(streamDeck.auth?.token) ?? '-'}
            </p>
          </section>
        )}

        {$DIM_FLAVOR !== 'release' && currentAccount?.destinyVersion === 2 && (
          <TroubleshootingSettings />
        )}
      </div>
    </div>
  );
}

function BungieTokenState({ token }: { token: Token }) {
  const tokenInception = new Date(token.inception);
  const expires = new Date(token.inception + token.expires * 1000);
  const expired = expires.getTime() < Date.now();
  return (
    <div className={styles.token}>
      <p>
        <b>Type:</b> {token.name}
      </p>
      <p>
        <b>Retrieved:</b> {tokenInception.toISOString()}
      </p>
      <p>
        <b>Expires:</b> {expires.toISOString()}
      </p>
      <p>
        <b>Expired?:</b> {JSON.stringify(expired)}
      </p>
    </div>
  );
}

function DIMTokenState({ token }: { token: DimAuthToken }) {
  const tokenInception = new Date(token.inception);
  const expires = new Date(token.inception + token.expiresInSeconds * 1000);
  const expired = expires.getTime() < Date.now();
  return (
    <div className={styles.token}>
      <p>
        <b>Retrieved:</b> {tokenInception.toISOString()}
      </p>
      <p>
        <b>Expires:</b> {expires.toISOString()}
      </p>
      <p>
        <b>Expired?:</b> {JSON.stringify(expired)}
      </p>
    </div>
  );
}

function ErrorInfo({ error }: { error: Error | DimError }) {
  const cause = error instanceof DimError ? error.cause : undefined;

  const code =
    error instanceof DimError || error instanceof BungieError
      ? error.code
      : error instanceof HttpStatusError
        ? `HTTP ${error.status}`
        : undefined;

  const name = error.name;
  const message = error.message || 'No message';

  return (
    <>
      <div className={styles.error}>
        {name}
        {code !== undefined && ' '}
        {code}: {message}
      </div>
      {cause && (
        <div>
          Cause: <ErrorInfo error={cause} />
        </div>
      )}
    </>
  );
}
