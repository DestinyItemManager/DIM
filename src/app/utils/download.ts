import { tempContainer } from './temp-container';

/** Download a string as a file */
export function download(data: string, filename: string, type: string) {
  const a = document.createElement('a');
  a.setAttribute('href', `data:${type};charset=utf-8,${encodeURIComponent(data)}`);
  a.setAttribute('download', filename);
  tempContainer.appendChild(a);
  a.click();
  setTimeout(() => tempContainer.removeChild(a));
}
