import { I18nKey, tl } from 'app/i18next-t';

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
  return url
    .split('|')
    .map((url) => url.trim())
    .filter((url) => {
      try {
        const parsedUrl = new URL(url); // throws if invalid
        if (parsedUrl.protocol !== 'https:' || !wishListAllowedHosts.includes(parsedUrl.host)) {
          return false;
        }
      } catch {
        return false;
      }

      return true;
    });
}
