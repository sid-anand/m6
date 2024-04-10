#!/bin/bash

T_FOLDER=${T_FOLDER:-t}
R_FOLDER=${R_FOLDER:-}

cd "$(dirname "$0")/..$R_FOLDER" || exit 1

DIFF=${DIFF:-diff}

if $DIFF <(cat "$T_FOLDER"/d/einstein-processed.txt | c/stem.js | sort) <(sort "$T_FOLDER"/d/einstein-stemmed.txt) > /dev/null;
then
    echo "$0 success: stemmed words are identical"
else
    echo "$0 failure: stemmed words are not identical"
fi
