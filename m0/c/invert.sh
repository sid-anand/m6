#!/bin/bash
# Invert index to create a mapping from terms to URLs containing that term
# The details of the index structure can be seen in the test cases

sort |
uniq -c |
awk -v url="$1" 'BEGIN { OFS=" | " } {
  ngram = $2;
  for (i = 3; i <= NF; i++) {
      ngram = ngram " " $i;
  }
  print ngram, $1, url;
}'
