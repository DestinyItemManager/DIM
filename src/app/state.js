export const dimState = {
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
