declare const gapi: any;

const drive = {
  client_id: $GOOGLE_DRIVE_CLIENT_ID,
  scope: 'https://www.googleapis.com/auth/drive.appdata',
  discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"],
  fetch_basic_profile: false
};

if (window.gapi) {
  gapi.load('client:auth2', () => {
    gapi.client.init(drive).then(() => {
      if ($featureFlags.debugSync) {
        console.log("gdrive init complete");
      }
      const auth = gapi.auth2.getAuthInstance();
      if (auth && auth.isSignedIn.get()) {
        window.location.href = '/index.html#!/settings?gdrive=true';
      } else {
        document.getElementById('return-error')!.style.display = 'block';
      }
    });
  });
} else {
  document.getElementById('return-error')!.style.display = 'block';
  console.warn("Google Drive API blocked");
}
