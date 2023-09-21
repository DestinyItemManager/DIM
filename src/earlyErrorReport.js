window.onerror = (e) => {
  // eslint-disable-next-line no-console
  console.log(e);
  const errorBox = document.querySelector('#errorreport');
  if (errorBox) {
    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    errorBox.value = e.toString();
  }
};
