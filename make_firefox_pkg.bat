set PATH=%PATH%;C:\Python27\;.\addon-sdk-1.17\bin;
set CUDDLEFISH_ROOT=.\addon-sdk-1.17
set PYTHONPATH=.\addon-sdk-1.17\python-lib
set VIRTUAL_ENV=.\addon-sdk-1.17
rmdir temp /S /Q
mkdir temp
mkdir temp\data
cp assets temp\data -R
cp css temp\data -R
cp js temp\data -R
mv temp\data\js\app.firefox.js temp\data\js\app.js
cp scripts temp\data -R
mv temp\data\scripts\bungie.firefox.js temp\data\scripts\bungie.js
cp lib temp -R
cp *.html temp\data
cp package.json temp
cfx xpi --pkgdir=temp
rmdir /S /Q temp