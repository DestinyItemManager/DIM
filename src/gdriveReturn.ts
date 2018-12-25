import { reportException } from './app/exceptions';

declare const gapi: any;

const drive = {
  client_id: $GOOGLE_DRIVE_CLIENT_ID,
  scope: 'https://www.googleapis.com/auth/drive.appdata',
  discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
  fetch_basic_profile: false
};

const returnUrl = '/index.html#!/settings?gdrive=true';

if (window.gapi) {
  gapi.load('client:auth2', () => {
    gapi.client.init(drive).then(
      () => {
        if ($featureFlags.debugSync) {
          console.log('gdrive init complete');
        }
        const auth = gapi.auth2.getAuthInstance();
        if (auth && auth.isSignedIn.get()) {
          window.location.href = returnUrl;
        } else {
          document.getElementById('return-error')!.style.display = 'block';
          reportException('gdriveReturn', new Error('Not logged in to Google Drive'));
          // Listen for sign-in state changes.
          auth.isSignedIn.listen((isSignedIn) => {
            if (isSignedIn) {
              window.location.href = returnUrl;
            }
          });
        }
      },
      (e) => {
        const error = new Error(
          'Google Auth Client failed to initialize: ' + JSON.stringify(e.details)
        );
        console.error(error);
        reportException('gdriveReturn', error);
      }
    );
  });
} else {
  document.getElementById('return-error')!.style.display = 'block';
  console.warn('Google Drive API blocked');
  reportException('gdriveReturn', new Error('Google Drive API blocked'));
}
