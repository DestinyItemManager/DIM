const path = require('path');
const { readFileSync, writeFileSync } = require('fs');
const { i18nextToPo } = require('i18next-conv');

function save(target) {
  return (result) => {
    writeFileSync(target, result);
  };
}

const source = path.join(__dirname, './src/i18n/dim_');
const langs = ['en', 'de', 'es', 'fr', 'it', 'ja', 'pt_BR'];
const options = { project: 'DIM' };

for (var i = 0; i < 7; i++) {
  i18nextToPo(langs[i], readFileSync(source + langs[i] + '.json'), options).then(save(source + langs[i] + '.po'));
}

