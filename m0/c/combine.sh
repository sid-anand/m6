#!/bin/bash
#
# Combine terms to create  n-grams (for n=1,2,3) and then count and sort them

awk 'BEGIN { OFS="\t" } {
  print $1; # Term

  if (prev_word) {
      print prev_word, $1; # Bigram
  }

  if (prev_prev_word && prev_word) {
      print prev_prev_word, prev_word, $1; # Trigram
  }

  prev_prev_word = prev_word;
  prev_word = $1;
}'
