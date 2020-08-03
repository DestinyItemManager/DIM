#!/bin/bash
array=()
mapfile -t -d '' array < <(find . -name "$1")
for file in ${array[@]}; do
  jq -S . $file >"$file"_sorted && mv "$file"_sorted $file
done
