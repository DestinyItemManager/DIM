import { getToken } from 'app/bungie-api/oauth-tokens';

(function (i, s, o, g, r, a, m) {
  i['GoogleAnalyticsObject'] = r;
  (i[r] =
    i[r] ||
    function () {
      (i[r].q = i[r].q || []).push(arguments);
    }),
    (i[r].l = 1 * new Date());
  (a = s.createElement(o)), (m = s.getElementsByTagName(o)[0]);
  a.async = 1;
  a.src = g;
  m.parentNode.insertBefore(a, m);
})(window, document, 'script', 'https://www.google-analytics.com/analytics.js', 'ga');

ga('create', $DIM_FLAVOR === 'release' ? 'UA-60316581-1' : 'UA-60316581-5', 'auto');
ga('set', 'anonymizeIp', true);
ga('set', 'dimension1', $DIM_VERSION);
ga('set', 'dimension2', $DIM_FLAVOR);

const token = getToken();
if (token && token.bungieMembershipId) {
  ga('set', 'userId', token.bungieMembershipId);
}
