import { DestinyAccount } from "./accounts/destiny-account.service";

export const dimState: {
  active: DestinyAccount | null;
  debug: boolean;
} = {
  /**
   * The active account - we put it here to break a circular dependency from
   * dimPlatformService. It should only be used from bungie-api classes.
   */
  active: null,
  /**
   * Whether we are in debug mode
   */
  debug: $featureFlags.debugMode
};
