window.onerror = (e) => {
  // eslint-disable-next-line no-console
  console.log('startup error', e);
  const errorBox = document.querySelector('#error-report');
  if (errorBox) {
    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    errorBox.value = e.toString();
  }
};
