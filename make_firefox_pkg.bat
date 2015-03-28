call ".\addon-sdk-1.17\bin\activate"
mkdir temp
mkdir temp\data
cp assets temp\data -R
cp css temp\data -R
cp js temp\data -R
cp scripts temp\data -R
mv temp\data\scripts\bungie.firefox.js temp\data\scripts\bungie.js
cp lib temp -R
cp *.html temp\data
cp package.json temp
cfx xpi --pkgdir=temp