window.onerror = (message, source, line, col, error) => {
  const params = { message, source, line, col };
  // eslint-disable-next-line no-console
  console.log(params, error);
  const errorBox = document.querySelector('#errorreport');
  if (errorBox) {
    errorBox.textContent = Object.entries(params)
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      .map(([k, v]) => `${k}:\n  ${v}`)
      .join('\n');
  }
};
