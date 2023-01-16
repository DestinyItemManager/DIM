import { Observable } from 'app/utils/observable';

export const installPrompt$ = new Observable<BeforeInstallPromptEvent | undefined>(undefined);

// This event is fired whenever the browser thinks it's possible to install the app. We then have
// to save the event itself to use it to show the install prompt from a menu item click.
window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent Chrome 67 and earlier from automatically showing the prompt
  e.preventDefault();
  // Stash the event so it can be triggered later.
  installPrompt$.next(e);
});
