#!/bin/bash

cd "$(dirname "$0")" || exit

./s_test_getText.sh
./s_test_getURLs.sh
./s_test_process.sh
./s_test_stem.sh
./s_test_combine.sh
