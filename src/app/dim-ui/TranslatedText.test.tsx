import { render } from '@testing-library/react';
import TranslatedText from './TranslatedText';

describe('TranslatedText', () => {
  const link = <a href="https://example.com">Example</a>;

  const cases: [text: string, expectedHtml: string][] = [
    ['Visit {{link}} for more', 'Visit <a href="https://example.com">Example</a> for more'],
    ['{{ link }} first', '<a href="https://example.com">Example</a> first'],
    ['Nothing to fill', 'Nothing to fill'],
    ['Unknown {{other}} stays', 'Unknown {{other}} stays'],
    // Markup in the translation itself is shown as text, not rendered
    [
      'Visit {{link}} <b onclick="x">now</b>',
      'Visit <a href="https://example.com">Example</a> &lt;b onclick="x"&gt;now&lt;/b&gt;',
    ],
  ];

  test.each(cases)('%s', (text, expectedHtml) => {
    const { container } = render(<TranslatedText text={text} values={{ link }} />);
    expect(container.innerHTML).toBe(expectedHtml);
  });
});
