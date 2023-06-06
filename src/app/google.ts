import { getToken } from 'app/bungie-api/oauth-tokens';

declare global {
  interface Window {
    dataLayer: unknown[][];
  }
}

window.dataLayer ??= [];
export function ga(...args: unknown[]) {
  window.dataLayer.push(args);
}

export function gaPageView(path: string, title?: string) {
  ga('event', 'page_view', {
    page_title: title,
    page_location: window.location.origin + path,
  });
}

export function gaEvent(type: string, params: Record<string, string>) {
  ga('event', type, params);
}

const propertyId = $DIM_FLAVOR === 'release' ? 'G-1PW23SGMHN' : 'G-MYWW38Z3LR';

const a = document.createElement('script');
const m = document.getElementsByTagName('script')[0];
a.async = true;
a.src = `https://www.googletagmanager.com/gtag/js?id=${propertyId}`;
m.parentNode!.insertBefore(a, m);

ga('js', new Date());
ga('set', {
  dim_version: $DIM_VERSION,
  dim_flavor: $DIM_FLAVOR,
});

const token = getToken();
if (token?.bungieMembershipId) {
  ga('set', { user_id: token.bungieMembershipId });
}

ga('config', propertyId, {
  store_gac: false,
  allow_ad_personalization_signals: false,
});
