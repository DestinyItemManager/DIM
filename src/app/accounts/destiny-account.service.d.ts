/**
 * A specific Destiny account (one per platform and Destiny version)
 */
export interface DestinyAccount {
  // Platform account name (gamertag or PSN ID)
  displayName: string;
  // platform ID
  platformType: number;
  // readable platform name
  platformLabel: string;
  // Destiny membership ID
  membershipId: string;
}

/**
 * @return {boolean} whether the accounts represent the same account
 */
declare function compareAccounts(account1: DestinyAccount, account2: DestinyAccount): boolean;