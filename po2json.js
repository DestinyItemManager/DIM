const path = require('path');
const { readFileSync, writeFileSync } = require('fs');
const { gettextToI18next } = require('i18next-conv');

function save(target) {
  return (result) => {
    writeFileSync(target, result);
  };
}

const source = path.join(__dirname, './src/i18n/dim_');
const langs = ['en', 'de', 'es', 'fr', 'it', 'ja', 'pt_BR'];
const options = { skipUntranslated: true };

for (let i = 0; i < 7; i++) {
  gettextToI18next(langs[i], readFileSync(`${source + langs[i]}.po`), options).then(save(`${source + langs[i]}.json`));
}
