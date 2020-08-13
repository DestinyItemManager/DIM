import { BungieMembershipType } from 'bungie-api-ts/common';
import {
  PlatformErrorCodes,
  DestinyGameVersions,
  DestinyLinkedProfilesResponse,
  DestinyProfileUserInfoCard,
} from 'bungie-api-ts/destiny2';
import { t } from 'app/i18next-t';
import _ from 'lodash';
import { getCharacters } from '../bungie-api/destiny1-api';
import { getLinkedAccounts } from '../bungie-api/destiny2-api';
import { reportException } from '../utils/exceptions';
import { removeToken } from '../bungie-api/oauth-tokens';
import { showNotification } from '../notifications/notifications';
import { stadiaIcon, battleNetIcon, faXbox, faPlaystation, faSteam } from 'app/shell/icons';
import { UserInfoCard } from 'bungie-api-ts/user';
import { loggedOut } from './actions';
import { ThunkResult } from 'app/store/types';
import { DestinyVersion } from '@destinyitemmanager/dim-api-types';

// See https://github.com/Bungie-net/api/wiki/FAQ:-Cross-Save-pre-launch-testing,-and-how-it-may-affect-you for more info

/**
 * Platform types (membership types) in the Bungie API.
 */
export const PLATFORM_LABELS = {
  // t('Accounts.Xbox')
  [BungieMembershipType.TigerXbox]: 'Xbox',
  // t('Accounts.PlayStation')
  [BungieMembershipType.TigerPsn]: 'PlayStation',
  // t('Accounts.Blizzard')
  [BungieMembershipType.TigerBlizzard]: 'Blizzard',
  [BungieMembershipType.TigerDemon]: 'Demon',
  // t('Accounts.Steam')
  [BungieMembershipType.TigerSteam]: 'Steam',
  // t('Accounts.Stadia')
  [BungieMembershipType.TigerStadia]: 'Stadia',
  [BungieMembershipType.BungieNext]: 'Bungie.net',
};

export const PLATFORM_LABEL_TO_MEMBERSHIP_TYPE = {
  Xbox: BungieMembershipType.TigerXbox,
  // t('Accounts.PlayStation')
  PlayStation: BungieMembershipType.TigerPsn,
  // t('Accounts.Blizzard')
  Blizzard: BungieMembershipType.TigerBlizzard,
  Demon: BungieMembershipType.TigerDemon,
  // t('Accounts.Steam')
  Steam: BungieMembershipType.TigerSteam,
  // t('Accounts.Stadia')
  Stadia: BungieMembershipType.TigerStadia,
  'Bungie.net': BungieMembershipType.BungieNext,
};

export const PLATFORM_ICONS = {
  [BungieMembershipType.TigerXbox]: faXbox,
  [BungieMembershipType.TigerPsn]: faPlaystation,
  [BungieMembershipType.TigerBlizzard]: battleNetIcon,
  [BungieMembershipType.TigerDemon]: 'Demon',
  [BungieMembershipType.TigerSteam]: faSteam,
  [BungieMembershipType.TigerStadia]: stadiaIcon,
  [BungieMembershipType.BungieNext]: 'Bungie.net',
};

/** A specific Destiny account (one per platform and Destiny version) */
export interface DestinyAccount {
  /** Platform account name (gamertag or PSN ID) */
  readonly displayName: string;
  /** The platform type this account started on. It may not be exclusive to this platform anymore, but this is what gets used to call APIs. */
  readonly originalPlatformType: BungieMembershipType;
  /** readable platform name */
  readonly platformLabel: string;
  /** Destiny platform membership ID. */
  readonly membershipId: string;
  /** Which version of Destiny is this account for? */
  readonly destinyVersion: DestinyVersion;
  /** Which version of Destiny 2 / DLC do they own? (not reliable after Cross-Save) */
  readonly versionsOwned?: DestinyGameVersions;
  /** All the platforms this account plays on (post-Cross-Save) */
  readonly platforms: BungieMembershipType[];

  /** When was this account last used? */
  readonly lastPlayed?: Date;
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
  bungieMembershipId: string
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
        dispatch(loggedOut(true));
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

/**
 * @param accounts raw Bungie API accounts response
 */
async function generatePlatforms(
  accounts: DestinyLinkedProfilesResponse
): Promise<DestinyAccount[]> {
  // accounts with errors could have had D1 characters!

  const accountPromises = accounts.profiles
    .flatMap((destinyAccount) => {
      const account: DestinyAccount = {
        displayName: destinyAccount.displayName,
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
          displayName: destinyAccount.displayName,
          originalPlatformType: destinyAccount.membershipType,
          membershipId: destinyAccount.membershipId,
          platformLabel: PLATFORM_LABELS[destinyAccount.membershipType],
          destinyVersion: 1,
          platforms: [destinyAccount.membershipType],
          lastPlayed: new Date(),
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
      })
    );

  const allPromise = Promise.all(accountPromises);
  return _.compact(await allPromise);
}

async function findD1Characters(account: DestinyAccount): Promise<any | null> {
  try {
    const response = await getCharacters(account);
    if (response?.length) {
      const result: DestinyAccount = {
        ...account,
        destinyVersion: 1,
        // D1 didn't support cross-save!
        platforms: [account.originalPlatformType],
        lastPlayed: getLastPlayedD1Character(response),
      };
      return result;
    }
    return null;
  } catch (e) {
    if (
      e.code &&
      (e.code === PlatformErrorCodes.DestinyAccountNotFound ||
        e.code === PlatformErrorCodes.DestinyLegacyPlatformInaccessible)
    ) {
      return null;
    }
    console.error('Error getting D1 characters for', account, e);
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
function getLastPlayedD1Character(response: { id: string; dateLastPlayed: string }[]): Date {
  return response.reduce((memo, rawStore) => {
    if (rawStore.id === 'vault') {
      return memo;
    }

    const d1 = new Date(rawStore.dateLastPlayed);

    return memo ? (d1 >= memo ? d1 : memo) : d1;
  }, new Date(0));
}

/**
 * @return whether the accounts represent the same account
 */
export function compareAccounts(account1: DestinyAccount, account2: DestinyAccount): boolean {
  return (
    account1 === account2 ||
    (account1 &&
      account2 &&
      account1.membershipId === account2.membershipId &&
      account1.destinyVersion === account2.destinyVersion)
  );
}
