/**
 * @typedef {Object} Platform - a specific Destiny account (one per platform and Destiny version)
 * @property {string} label - the readable name of the platform
 */

/**
 * Platform types (membership types) in the Bungie API.
 * @type {Platform[]}
 */
export const PLATFORMS = {
  1: {
    label: 'Xbox'
  },

  2: {
    label: 'PlayStation'
  },

  254: {
    label: 'Bungie.net'
  }
};
