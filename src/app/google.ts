import { getToken } from 'app/bungie-api/oauth-tokens';
import { browserName, browserVersion } from './utils/system-info';

declare global {
  interface Window {
    dataLayer: any[];
  }
}

window.dataLayer ||= [];

export function ga(..._args: any[]) {
  // Google Analytics actually requires that we push arguments here, not _args!
  // eslint-disable-next-line prefer-rest-params
  window.dataLayer.push(arguments);
}

export function gaPageView(path: string, title?: string) {
  ga('event', 'page_view', {
    page_title: title,
    page_location: window.location.origin + path,
    page_path: path,
  });
}

export function gaEvent(type: string, params: Record<string, string>) {
  ga('event', type, params);
}

export function initGoogleAnalytics() {
  ga('js', new Date());
  const token = getToken();
  ga('config', $ANALYTICS_PROPERTY, {
    allow_ad_personalization_signals: false,
    allow_google_signals: false,
    send_page_view: false,
    user_id: token?.bungieMembershipId,
    dim_version: $DIM_VERSION,
    dim_flavor: $DIM_FLAVOR,
    browser_name: browserName,
    browser_version: browserVersion,
  });

  const script = document.createElement('script');
  script.type = 'text/javascript';
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${$ANALYTICS_PROPERTY}`;
  document.head.appendChild(script);
}
