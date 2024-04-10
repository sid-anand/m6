#!/usr/bin/env node

// merge two files---the incoming 1-page index and the global index (on disk)
// the details of the global index can be seen in the test cases.

const fs = require('fs');
// const {exit} = require('process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
});

// TODO some code here
const map = {};
const globalIndex = process.argv[2];

rl.on('line', (line) => {
  // TODO some code here
  // ASSUMES UNIQUENESS!!!
  const [ngram, count, url] = line.split(' | ');
  map[ngram] = [count, url];
});

rl.on('close', () => {
  mergeIndices();
});

const mergeIndices = () => {
  // TODO some code here
  const data = fs.readFileSync(globalIndex, {encoding: 'utf8'});
  const lines = data.split('\n');
  for (const line of lines) {
    if (line) {
      const [ngram, pairs] = line.split(' | ');
      if (map[ngram]) {
        const [count, url] = map[ngram];
        // [url1, count1, url2, count2, ...]
        const pairsList = pairs.split(' ');
        let inserted = false;
        for (let i = 0; i < pairsList.length; i += 2) {
          if (parseInt(pairsList[i + 1], 10) < parseInt(count, 10)) {
            pairsList.splice(i, 0, url, count);
            inserted = true;
            break;
          }
        }
        if (!inserted) {
          pairsList.push(url, count);
        }
        console.log(`${ngram} | ${pairsList.join(' ')}`);
        delete map[ngram];
      } else {
        console.log(line);
      }
    }
  }
  // add the remaining ngrams from the local index
  for (const ngram in map) {
    if (map.hasOwnProperty(ngram)) {
      const [count, url] = map[ngram];
      console.log(`${ngram} | ${url} ${count}`);
    }
  }
};
