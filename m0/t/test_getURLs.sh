#!/bin/bash
T_FOLDER=${T_FOLDER:-t}
R_FOLDER=${R_FOLDER:-}

cd "$(dirname "$0")/..$R_FOLDER" || exit 1

DIFF=${DIFF:-diff}

url="https://cs.brown.edu/courses/csci1380/sandbox/1/level_1a/index.html"

if $DIFF <(cat "$T_FOLDER"/d/d0.txt | c/getURLs.js $url | sort) <(sort "$T_FOLDER"/d/d1.txt) > /dev/null;
then
    echo "$0 success: URL sets are identical"
else
    echo "$0 failure: URL sets are not identical"
fi
