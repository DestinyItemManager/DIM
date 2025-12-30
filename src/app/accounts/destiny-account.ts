import { DestinyVersion } from '@destinyitemmanager/dim-api-types';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { D1Character } from 'app/destiny1/d1-manifest-types';
import { t } from 'app/i18next-t';
import { epicIcon, faPlayStation, faSteam, faXbox } from 'app/shell/icons';
import { ThunkResult } from 'app/store/types';
import { compact } from 'app/utils/collections';
import { DimError } from 'app/utils/dim-error';
import { errorLog } from 'app/utils/log';
import { LookupTable } from 'app/utils/util-types';
import {
  BungieMembershipType,
  DestinyLinkedProfilesResponse,
  DestinyProfileUserInfoCard,
  PlatformErrorCodes,
} from 'bungie-api-ts/destiny2';
import { UserInfoCard } from 'bungie-api-ts/user';
import { getCharacters } from '../bungie-api/destiny1-api';
import { getLinkedAccounts } from '../bungie-api/destiny2-api';
import { removeToken } from '../bungie-api/oauth-tokens';
import { showNotification } from '../notifications/notifications';
import { reportException } from '../utils/sentry';
import { loggedOut } from './actions';

// See https://github.com/Bungie-net/api/wiki/FAQ:-Cross-Save-pre-launch-testing,-and-how-it-may-affect-you for more info

/**
 * Platform types (membership types) in the Bungie API.
 */
export const PLATFORM_LABELS: Record<BungieMembershipType, string> = {
  [BungieMembershipType.None]: 'None',
  [BungieMembershipType.All]: 'All',
  [BungieMembershipType.TigerXbox]: 'Xbox',
  [BungieMembershipType.TigerPsn]: 'PlayStation',
  [BungieMembershipType.TigerBlizzard]: 'Blizzard',
  [BungieMembershipType.TigerDemon]: 'Demon',
  [BungieMembershipType.TigerSteam]: 'Steam',
  [BungieMembershipType.TigerStadia]: 'Stadia',
  [BungieMembershipType.TigerEgs]: 'Epic',
  [BungieMembershipType.BungieNext]: 'Bungie.net',
  [BungieMembershipType.GoliathGame]: 'Marathon',
};

export const PLATFORM_ICONS: LookupTable<BungieMembershipType, string | IconDefinition> = {
  [BungieMembershipType.TigerXbox]: faXbox,
  [BungieMembershipType.TigerPsn]: faPlayStation,
  [BungieMembershipType.TigerSteam]: faSteam,
  [BungieMembershipType.TigerEgs]: epicIcon,
};

/** A specific Destiny account (one per platform and Destiny version) */
export interface DestinyAccount {
  /** Bungie Name */
  readonly displayName: string;
  /** The platform type this account started on. It may not be exclusive to this platform anymore, but this is what gets used to call APIs. */
  readonly originalPlatformType: BungieMembershipType;
  /** readable platform name */
  readonly platformLabel: string;
  /** Destiny platform membership ID. */
  readonly membershipId: string;
  /** Which version of Destiny is this account for? */
  readonly destinyVersion: DestinyVersion;
  /** All the platforms this account plays on (post-Cross-Save) */
  readonly platforms: BungieMembershipType[];

  /** When was this account last used? */
  readonly lastPlayed: Date;
}

/**
 * Get all Destiny accounts associated with a Bungie account.
 *
 * Each Bungie.net account may be linked with one Destiny 1 account
 * per platform (Xbox, PS4) and one Destiny 2 account per platform (Xbox, PS4, PC).
 * This account is indexed by a Destiny membership ID and is how we access their characters.
 *
 * We don't know whether or not the account is associated with D1 or D2 characters until we
 * try to load them.
 *
 * @param bungieMembershipId Bungie.net membership ID
 */
export function getDestinyAccountsForBungieAccount(
  bungieMembershipId: string,
): ThunkResult<DestinyAccount[]> {
  return async (dispatch) => {
    try {
      const linkedAccounts = await getLinkedAccounts(bungieMembershipId);
      const platforms = await generatePlatforms(linkedAccounts);
      if (platforms.length === 0) {
        showNotification({
          type: 'warning',
          title: t('Accounts.NoCharacters'),
        });
        removeToken();
        dispatch(loggedOut());
      }
      return platforms;
    } catch (e) {
      reportException('getDestinyAccountsForBungieAccount', e);
      throw e;
    }
  };
}

/**
 * Could this account have a D1 account associated with it?
 */
function couldBeD1Account(destinyAccount: DestinyProfileUserInfoCard | UserInfoCard) {
  // D1 was only available for PS/Xbox
  return (
    destinyAccount.membershipType === BungieMembershipType.TigerXbox ||
    destinyAccount.membershipType === BungieMembershipType.TigerPsn
  );
}

function formatBungieName(destinyAccount: DestinyProfileUserInfoCard | UserInfoCard) {
  return (
    destinyAccount.bungieGlobalDisplayName +
    (destinyAccount.bungieGlobalDisplayNameCode
      ? `#${destinyAccount.bungieGlobalDisplayNameCode.toString().padStart(4, '0')}`
      : '')
  );
}

/**
 * @param accounts raw Bungie API accounts response
 */
export async function generatePlatforms(
  accounts: DestinyLinkedProfilesResponse,
): Promise<DestinyAccount[]> {
  // accounts with errors could have had D1 characters!
  const accountPromises = accounts.profiles
    .flatMap((destinyAccount) => {
      const account: DestinyAccount = {
        displayName: formatBungieName(destinyAccount),
        originalPlatformType: destinyAccount.membershipType,
        membershipId: destinyAccount.membershipId,
        platformLabel: PLATFORM_LABELS[destinyAccount.membershipType],
        destinyVersion: 2,
        platforms: destinyAccount.applicableMembershipTypes,
        lastPlayed: new Date(destinyAccount.dateLastPlayed),
      };

      // For accounts that were folded into Cross Save, only consider them as D1 accounts.
      if (destinyAccount.isOverridden) {
        return couldBeD1Account(destinyAccount) ? [findD1Characters(account)] : [];
      }

      return couldBeD1Account(destinyAccount) ? [account, findD1Characters(account)] : [account];
    })
    .concat(
      // Profiles with errors could be D1 accounts
      // Consider both D1 and D2 accounts with errors, save profile errors and show on page
      // unless it's a specific error like DestinyAccountNotFound
      accounts.profilesWithErrors.flatMap((errorProfile) => {
        const destinyAccount = errorProfile.infoCard;
        const account: DestinyAccount = {
          displayName: formatBungieName(destinyAccount),
          originalPlatformType: destinyAccount.membershipType,
          membershipId: destinyAccount.membershipId,
          platformLabel: PLATFORM_LABELS[destinyAccount.membershipType],
          destinyVersion: 2,
          platforms: destinyAccount.applicableMembershipTypes,
          lastPlayed: new Date(0),
        };

        if (
          errorProfile.errorCode === PlatformErrorCodes.DestinyAccountNotFound ||
          errorProfile.errorCode === PlatformErrorCodes.DestinyLegacyPlatformInaccessible
        ) {
          // If the error positively identifies this as not being a D2 account, only look for D1 accounts
          return couldBeD1Account(destinyAccount) ? [findD1Characters(account)] : [];
        } else {
          // Otherwise, this could be a D2 account while the API is having trouble.
          return couldBeD1Account(destinyAccount)
            ? [account, findD1Characters(account)]
            : [account];
        }
      }),
    );
  // Yes, this knowingly mixes promises and non-promises
  // eslint-disable-next-line @typescript-eslint/await-thenable
  return compact(await Promise.all(accountPromises));
}

async function findD1Characters(account: DestinyAccount): Promise<DestinyAccount | null> {
  try {
    const { characters } = await getCharacters(account);
    if (characters?.length) {
      return {
        ...account,
        destinyVersion: 1,
        // D1 didn't support cross-save!
        platforms: [account.originalPlatformType],
        lastPlayed: getLastPlayedD1Character(characters),
      };
    }
    return null;
  } catch (e) {
    const code = e instanceof DimError ? e.bungieErrorCode() : undefined;
    if (
      code === PlatformErrorCodes.DestinyAccountNotFound ||
      code === PlatformErrorCodes.DestinyLegacyPlatformInaccessible
    ) {
      return null;
    }
    errorLog('accounts', 'Error getting D1 characters for', account, e);
    reportException('findD1Characters', e);

    // Return the account as if it had succeeded so it shows up in the menu
    return {
      ...account,
      destinyVersion: 1,
      // D1 didn't support cross-save!
      platforms: [account.originalPlatformType],
      lastPlayed: new Date(0),
    };
  }
}

/**
 * Find the date of the most recently played character.
 */
function getLastPlayedD1Character(characters: D1Character[]): Date {
  return characters.reduce((memo, character) => {
    const d1 = new Date(character.characterBase.dateLastPlayed ?? 0);

    return memo ? (d1 >= memo ? d1 : memo) : d1;
  }, new Date(0));
}

/**
 * @return whether the accounts represent the same account
 */
export function compareAccounts(
  account1: DestinyAccount | undefined,
  account2: DestinyAccount | undefined,
): boolean {
  return Boolean(
    account1 === account2 ||
    (account1 &&
      account1.membershipId === account2?.membershipId &&
      account1.destinyVersion === account2.destinyVersion),
  );
}
