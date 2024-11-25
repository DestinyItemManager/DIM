import {
  DeleteLoadoutUpdate,
  DeleteSearchUpdate,
  DestinyVersion,
  Loadout,
  ProfileUpdate,
  SearchType,
} from '@destinyitemmanager/dim-api-types';

// https://stackoverflow.com/questions/51691235/typescript-map-union-type-to-another-union-type
type AddUpdateInfo<U> = U extends ProfileUpdate
  ? U & {
      /** The state before this update - if it fails we can use this to roll back */
      before: U['payload'] | undefined;
      /** The account (if any) this update refers to */
      platformMembershipId?: string;
      destinyVersion?: DestinyVersion;
    }
  : never;

export interface DeleteLoadoutUpdateWithRollback extends DeleteLoadoutUpdate {
  before: Loadout;
  platformMembershipId: string;
  destinyVersion: DestinyVersion;
}

export interface DeleteSearchUpdateWithRollback extends DeleteSearchUpdate {
  before: {
    query: string;
    type: SearchType;
    saved: boolean;
  };
  platformMembershipId: string;
  destinyVersion: DestinyVersion;
}

/**
 * A version of ProfileUpdate that also includes rollback info in a "before" property.
 */
export type ProfileUpdateWithRollback =
  | DeleteSearchUpdateWithRollback
  | DeleteLoadoutUpdateWithRollback
  | AddUpdateInfo<ProfileUpdate>;
