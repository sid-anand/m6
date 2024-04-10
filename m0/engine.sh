#!/bin/bash
# This is the main entry point of the search engine.
cd "$(dirname "$0")" || exit
cat /dev/null > d/visited.txt

while read -r url; do

  if [[ "$url" == "stop" ]]; then
    # stop the engine if it sees the string "stop" 
    break;
  fi

  ./crawl.sh "$url" >d/content.txt
  ./index.sh d/content.txt "$url"

  if  [[ "$(cat d/visited.txt | wc -l)" -ge "$(cat d/urls.txt | wc -l)" ]]; then
      # stop the engine if it has seen all available URLs
      break;
  fi

done < <(tail -f d/urls.txt)
