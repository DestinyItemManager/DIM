import { getToken } from 'app/bungie-api/oauth-tokens';

declare global {
  interface Window {
    dataLayer: any[];
  }
}

export function ga(...args: unknown[]) {
  window.dataLayer?.push(args);
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

export function initGoogleAnalytics() {
  const script = document.createElement('script');
  script.type = 'text/javascript';
  script.async = true;
  // ensure PageViews is always tracked (on script load)
  script.onload = () => {
    window.dataLayer ??= [];
    // https:// constantsolutions.dk/2020/06/delay-loading-of-google-analytics-google-tag-manager-script-for-better-pagespeed-score-and-initial-load/
    window.dataLayer.push({
      event: 'gtm.js',
      'gtm.start': new Date().getTime(),
      'gtm.uniqueEventId': 0,
    });
    ga('js', new Date());
    ga('set', {
      dim_version: $DIM_VERSION,
      dim_flavor: $DIM_FLAVOR,
    });

    const token = getToken();
    if (token?.bungieMembershipId) {
      ga('set', { user_id: token.bungieMembershipId });
    }

    ga('config', $ANALYTICS_PROPERTY, {
      store_gac: false,
      allow_ad_personalization_signals: false,
      send_page_view: false,
    });
  };
  script.src = `https://www.googletagmanager.com/gtag/js?id=${$ANALYTICS_PROPERTY}`;
  document.head.appendChild(script);
}
