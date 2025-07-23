import { readFileSync, writeFileSync } from 'fs';

function cleanJsonFile(inputFile) {
  try {
    const fileContent = readFileSync(inputFile, 'utf8');
    const data = JSON.parse(fileContent);
    const cleanedData = removeEmptyStrings(data);
    writeFileSync(inputFile, JSON.stringify(cleanedData, null, 2) + '\r\n', 'utf8');
    console.log(`Successfully cleaned JSON file: ${inputFile}`);
    return cleanedData;
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.error(`Error: File '${inputFile}' not found.`);
    } else if (error instanceof SyntaxError) {
      console.error(`Error: Invalid JSON format in '${inputFile}': ${error.message}`);
    } else {
      console.error(`Error processing file: ${error.message}`);
    }
    return null;
  }
}

function cleanData(data) {
  return removeEmptyStrings(data);
}

function removeEmptyStrings(data) {
  if (Array.isArray(data)) {
    return data.map((item) => removeEmptyStrings(item));
  } else if (data !== null && typeof data === 'object') {
    const cleaned = {};
    for (const [key, value] of Object.entries(data)) {
      // Only remove if value is specifically an empty string
      if (!(typeof value === 'string' && value.length === 0)) {
        cleaned[key] = removeEmptyStrings(value);
      }
    }
    return cleaned;
  } else {
    return data;
  }
}

function removeKeysFromFile(inputFile, keysToRemove) {
  try {
    const fileContent = readFileSync(inputFile, 'utf8');
    const data = JSON.parse(fileContent);
    const cleanedData = removeKeys(data, keysToRemove);
    writeFileSync(inputFile, JSON.stringify(cleanedData, null, 2) + '\r\n', 'utf8');
    console.log(`Successfully removed keys from JSON file: ${inputFile}`);
    return cleanedData;
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.error(`Error: File '${inputFile}' not found.`);
    } else if (error instanceof SyntaxError) {
      console.error(`Error: Invalid JSON format in '${inputFile}': ${error.message}`);
    } else {
      console.error(`Error processing file: ${error.message}`);
    }
    return null;
  }
}

function removeKeys(data, keysToRemove) {
  const result = JSON.parse(JSON.stringify(data));

  keysToRemove.forEach((keyPath) => {
    deleteNestedKey(result, keyPath);
  });

  return result;
}

function deleteNestedKey(obj, keyPath) {
  const keys = keyPath.split('.');
  const lastKey = keys.pop();

  let current = obj;
  for (const key of keys) {
    if (current[key] && typeof current[key] === 'object') {
      current = current[key];
    } else {
      return;
    }
  }

  if (current && typeof current === 'object') {
    delete current[lastKey];
  }
}

export { cleanData, cleanJsonFile, removeKeys, removeKeysFromFile };

const locales = [
  'en',
  'de',
  'es',
  'esMX',
  'fr',
  'it',
  'ja',
  'ko',
  'pl',
  'ptBR',
  'ru',
  'zhCHS',
  'zhCHT',
];
locales.forEach((locale) => {
  cleanJsonFile(`./src/locale/${locale}.json`);
});

// Add any keys that we no longer use here, that we want in i18n.json for history

const keysToBeRemoved = [
  'Loadouts.Equipped',
  'Loadouts.Filters',
  'Loadouts.MissingItems',
  'Loadouts.RandomizePrompt',
  'Loadouts.RandomizeWeapons',
  'Loadouts.Unequipped',
  'Loadouts.WeaponsOnly',
  'WishListRoll.PreMadeFiles',
  'WishListRoll.Untitled',
];

removeKeysFromFile('./src/locale/en.json', keysToBeRemoved);
