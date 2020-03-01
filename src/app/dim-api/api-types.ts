import { ProfileUpdate } from '@destinyitemmanager/dim-api-types';
import { DestinyAccount } from 'app/accounts/destiny-account';

// https://stackoverflow.com/questions/51691235/typescript-map-union-type-to-another-union-type
type AddUpdateInfo<U> = U extends ProfileUpdate
  ? U & {
      /** A session-unique ID for this update */
      updateId: number;
      /** The state before this update - if it fails we can use this to roll back */
      before: U['payload'];
      /** The account (if any) this update refers to */
      account?: DestinyAccount;
    }
  : never;

/**
 * A version of ProfileUpdate that also includes rollback info in a "before" property.
 */
export type ProfileUpdateWithRollback = AddUpdateInfo<ProfileUpdate>;
