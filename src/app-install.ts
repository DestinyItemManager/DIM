import { Subject } from 'rxjs/Subject';

export const installPrompt$ = new Subject<any>();

window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent Chrome 67 and earlier from automatically showing the prompt
  e.preventDefault();
  // Stash the event so it can be triggered later.
  installPrompt$.next(e);
});
