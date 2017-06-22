const path = require('path');
const { readFileSync, writeFileSync } = require('fs');
const {
  i18nextToPo
} = require('i18next-conv');

const source = {
  en: path.join(__dirname, './src/i18n/dim_en.json'),
  de: path.join(__dirname, './src/i18n/dim_de.json'),
  es: path.join(__dirname, './src/i18n/dim_es.json'),
  fr: path.join(__dirname, './src/i18n/dim_fr.json'),
  it: path.join(__dirname, './src/i18n/dim_it.json'),
  ja: path.join(__dirname, './src/i18n/dim_ja.json'),
  pt_BR: path.join(__dirname, './src/i18n/dim_pt_BR.json')
};
const options = { project: 'DIM' };

function save(target) {
  return (result) => {
    writeFileSync(target, result);
  };
}

i18nextToPo('en', readFileSync(source.en), options).then(save('./src/i18n/dim_en.po'));
i18nextToPo('de', readFileSync(source.de), options).then(save('./src/i18n/dim_de.po'));
i18nextToPo('es', readFileSync(source.es), options).then(save('./src/i18n/dim_es.po'));
i18nextToPo('fr', readFileSync(source.fr), options).then(save('./src/i18n/dim_fr.po'));
i18nextToPo('it', readFileSync(source.it), options).then(save('./src/i18n/dim_it.po'));
i18nextToPo('ja', readFileSync(source.ja), options).then(save('./src/i18n/dim_ja.po'));
i18nextToPo('pt_BR', readFileSync(source.pt_BR), options).then(save('./src/i18n/dim_pt_BR.po'));
