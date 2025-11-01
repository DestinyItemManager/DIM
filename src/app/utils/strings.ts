// http://blog.tatedavies.com/2012/08/28/replace-microsoft-chars-in-javascript/
export function normalizeQuoteChars(str: string) {
  return str.replace(/[\u2018-\u201A]/g, "'").replace(/[\u201C-\u201E]/g, '"');
}
