#!/bin/bash

echo "$1" >>d/visited.txt

curl -sL "$1" |
  tee >(c/getURLs.js "$1" | grep -vxf d/visited.txt | grep -vxf d/urls.txt > d/temp-urls.txt) |
  c/getText.js

cat d/temp-urls.txt >> d/urls.txt

rm d/temp-urls.txt
