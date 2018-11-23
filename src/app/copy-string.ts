/** Copy a string to the clipboard */
export default function copyString(str) {
  function listener(e) {
    e.clipboardData.setData('text/plain', str);
    e.preventDefault();
  }
  document.addEventListener('copy', listener);
  document.execCommand('copy');
  document.removeEventListener('copy', listener);
}
