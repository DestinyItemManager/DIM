export function http($httpProvider) {
  "ngInject";

  $httpProvider.interceptors.push("ngHttpRateLimiterInterceptor");

  if (!window.chrome || !window.chrome.extension) {
    $httpProvider.interceptors.push('http-refresh-token');
  }
}
