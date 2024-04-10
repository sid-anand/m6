#!/bin/bash

cd "$(dirname "$0")" || exit

./test_lint.sh

./test_getURLs.sh
./test_getText.sh
./test_process.sh
./test_stem.sh
./test_combine.sh
./test_invert.sh
./test_merge.sh
./test_query.sh
./test_end_to_end.sh
