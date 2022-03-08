const fs = require('fs');

const brands = { svg: '', eot: '', ttf: '', woff: '', woff2: '' };
const regular = { svg: '', eot: '', ttf: '', woff: '', woff2: '' };
const solid = { svg: '', eot: '', ttf: '', woff: '', woff2: '' };

const regexpFontAwesomeFileNames = /^fa-(\D{5,7})-\d{3}-(.{6}).(.{3,5})$/;
const regexpFontAwesomeFileNamesMissingHash = /^fa-(\D{5,7})-\d{3}.(.{3,5})$/;
const filenamesBefore = fs.readdirSync('./dist/static');

filenamesBefore.forEach((file) => {
  const match = file.match(regexpFontAwesomeFileNames);
  if (match) {
    switch (match[1]) {
      case 'brands':
        brands[match[3]] = match[2];
        break;
      case 'regular':
        regular[match[3]] = match[2];
        break;
      case 'solid':
        solid[match[3]] = match[2];
        break;
    }
    /*
    fs.rm(`./dist/static/${file}`, { recursive: true }, (err) => {
      if (err) {
        // console.error(err.message);
      }
    });
    */
  }
});

const filenamesAfter = fs.readdirSync('./dist/static');
filenamesAfter.forEach((file) => {
  const match = file.match(regexpFontAwesomeFileNamesMissingHash);
  let contenthash;
  if (match) {
    const fileNoExtension = file.replace(/\.[^/.]+$/, '');
    switch (match[1]) {
      case 'brands':
        contenthash = brands[match[2]];
        break;
      case 'regular':
        contenthash = regular[match[2]];
        break;
      case 'solid':
        contenthash = solid[match[2]];
        break;
    }
    fs.renameSync(
      `./dist/static/${file}`,
      `./dist/static/${fileNoExtension}-${contenthash}.${match[2]}`
    );
  }
});
