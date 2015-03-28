call "make_firefox_pkg.bat"
timeout 1
rmdir /S /Q temp
rm -rf temp
call "make_chrome_pkg.bat"