#!/bin/bash

git clone https://github.com/google/brotli.git
cd brotli
mkdir out
cd out
../configure-cmake --prefix="$PWD/bin"
make install

