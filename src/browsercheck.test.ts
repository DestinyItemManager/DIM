import { isSupported } from './browsercheck';

// A snapshot of our support list so these tests will always work
const browsersSupported = [
  'and_chr 78',
  'and_ff 68',
  'chrome 78',
  'chrome 77',
  'edge 18',
  'edge 17',
  'firefox 71',
  'firefox 70',
  'firefox 68',
  'ios_saf 13.2',
  'ios_saf 13.0-13.1',
  'ios_saf 12.2-12.4',
  'ios_saf 12.0-12.1',
  'ios_saf 11.3-11.4',
  'ios_saf 11.0-11.2',
  'opera 64',
  'opera 63',
  'safari 13',
  'safari 12.1',
];

test.each([
  [
    'Firefox 72',
    'Mozilla/5.0 (Windows NT 6.3; Win64; x64; rv:72.0) Gecko/20100101 Firefox/72.0',
    true,
  ],
  [
    'Chrome 79',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.88 Safari/537.36',
    true,
  ],
  [
    'iOS 12',
    'Mozilla/5.0 (iPod; CPU iPhone OS 12_0 like macOS) AppleWebKit/602.1.50 (KHTML, like Gecko) Version/12.0 Mobile/14A5335d Safari/602.1.50',
    true,
  ],
  [
    'Edge 18',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.102 Safari/537.36 Edge/18.18362',
    true,
  ],
  [
    'Vivaldi',
    'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.88 Safari/537.36 Vivaldi/2.10',
    true,
  ],
  [
    'Opera',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.88 Safari/537.36 OPR/65.0.3467.78',
    true,
  ],
  [
    'Old Chrome',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.78 Safari/537.36',
    false,
  ],
  // This isn't actually checked in isSupported anymore, but it's nice to have the example user agent here. It's up to Chrome 85 now though...
  // [
  //   'Steam Overlay',
  //   'Mozilla/5.0 (Windows; U; Windows NT 10.0; en-US; Valve Steam GameOverlay/1608507519; ) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.117 Safari/537.36',
  //   false,
  // ],
])('%s: User agent %s, supported: %s', (_name, userAgent, shouldBeSupported) => {
  expect(isSupported(browsersSupported, userAgent)).toStrictEqual(shouldBeSupported);
});
