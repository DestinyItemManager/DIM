import { isAllowedLink } from './ClarityDescriptions';

test('isAllowedLink accepts http(s) URLs', () => {
  expect(isAllowedLink('https://d2foundry.gg/')).toBe(true);
  expect(isAllowedLink('http://example.com/path?a=b')).toBe(true);
});

test('isAllowedLink rejects dangerous or malformed schemes', () => {
  expect(isAllowedLink('javascript:alert(document.cookie)')).toBe(false);
  expect(isAllowedLink('data:text/html,<script>alert(1)</script>')).toBe(false);
  expect(isAllowedLink('vbscript:msgbox(1)')).toBe(false);
  expect(isAllowedLink('file:///etc/passwd')).toBe(false);
  expect(isAllowedLink('not a url')).toBe(false);
  expect(isAllowedLink('')).toBe(false);
});
