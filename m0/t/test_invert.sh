#!/bin/bash
T_FOLDER=${T_FOLDER:-t}
R_FOLDER=${R_FOLDER:-}

cd "$(dirname "$0")/..$R_FOLDER" || exit 1

DIFF=${DIFF:-diff}


url="https://cs.brown.edu/courses/csci1380/sandbox/1/level_1a/index.html"

if $DIFF <(cat "$T_FOLDER"/d/d5.txt | c/invert.sh $url | sed 's/[[:space:]]//g') <(cat "$T_FOLDER"/d/d6.txt | sed 's/[[:space:]]//g') > /dev/null;
then
    echo "$0 success: inverted indices are identical"
else
    echo "$0 failure: inverted indices are not identical"
fi
