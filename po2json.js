const path = require('path');
const { readFileSync, writeFileSync } = require('fs');
const {
  gettextToI18next
} = require('i18next-conv');

const source = {
  en: path.join(__dirname, './src/i18n/dim_en.po'),
  de: path.join(__dirname, './src/i18n/dim_de.po'),
  es: path.join(__dirname, './src/i18n/dim_es.po'),
  fr: path.join(__dirname, './src/i18n/dim_fr.po'),
  it: path.join(__dirname, './src/i18n/dim_it.po'),
  ja: path.join(__dirname, './src/i18n/dim_ja.po'),
  pt_BR: path.join(__dirname, './src/i18n/dim_pt_BR.po')
};
const options = { skipUntranslated: true };

function save(target) {
  return (result) => {
    writeFileSync(target, result);
  };
}

gettextToI18next('en', readFileSync(source.en), options).then(save('./src/i18n/dim_en.json'));
gettextToI18next('de', readFileSync(source.de), options).then(save('./src/i18n/dim_de.json'));
gettextToI18next('es', readFileSync(source.es), options).then(save('./src/i18n/dim_es.json'));
gettextToI18next('fr', readFileSync(source.fr), options).then(save('./src/i18n/dim_fr.json'));
gettextToI18next('it', readFileSync(source.it), options).then(save('./src/i18n/dim_it.json'));
gettextToI18next('ja', readFileSync(source.ja), options).then(save('./src/i18n/dim_ja.json'));
gettextToI18next('pt_BR', readFileSync(source.pt_BR), options).then(save('./src/i18n/dim_pt_BR.json'));
