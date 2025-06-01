import { I18nKey, tl } from 'app/i18next-t';
import { filterMap } from 'app/utils/collections';

export const builtInWishlists: { name: I18nKey; url: string }[] = [
  {
    name: tl('WishListRoll.Voltron'),
    url: 'https://raw.githubusercontent.com/48klocs/dim-wish-list-sources/master/voltron.txt',
  },
  {
    name: tl('WishListRoll.JustAnotherTeam'),
    url: 'https://raw.githubusercontent.com/dsf000z/JAT-wishlists-bundler/main/bundles/DIM-strict/just-another-team-mnk.txt',
  },
];

// config/content-security-policy.js must be edited alongside this list
export const wishListAllowedHosts = ['raw.githubusercontent.com', 'gist.githubusercontent.com'];
export function validateWishListURLs(url: string): string[] {
  return filterMap(url.split('|'), (url) => {
    url = url.trim();
    if (!url) {
      return undefined; // skip empty strings
    }
    try {
      const parsedUrl = new URL(url); // throws if invalid
      if (parsedUrl.protocol !== 'https:') {
        return undefined;
      } else if (!wishListAllowedHosts.includes(parsedUrl.host)) {
        // If folks paste the github link, change it to the raw link
        if (parsedUrl.host === 'github.com') {
          // e.g. github.com/48klocs/dim-wish-list-sources/blob/master/voltron.txt => https://raw.githubusercontent.com/48klocs/dim-wish-list-sources/refs/heads/master/voltron.txt
          const match = parsedUrl.pathname.match(/^\/([^/]+)\/([^/]+)\/blob\/(.*)/);
          if (match) {
            return `https://raw.githubusercontent.com/${match[1]}/${match[2]}/refs/heads/${match[3]}`;
          }
        }
        return undefined;
      }
      return parsedUrl.toString();
    } catch {
      return undefined;
    }
  });
}
