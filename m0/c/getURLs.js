#!/usr/bin/env node

const readline = require('readline');
const {JSDOM} = require('jsdom');
const {URL} = require('url');

// Example usage:
const inputURL = process.argv[2];
let baseURL;
if (inputURL.endsWith('.html')) {
  baseURL = inputURL;
} else {
  baseURL = `${inputURL}/`;
}

const rl = readline.createInterface({
  input: process.stdin,
});

// TODO some code
let domString = '';

rl.on('line', (line) => {
  // TODO some code
  domString += line;
});

rl.on('close', () => {
  // TODO some code
  const {document} = (new JSDOM(domString)).window;
  const hrefs = [...document.links].map((link) => link.href);
  const hrefsWithoutDups = hrefs.filter((h, idx) => hrefs.indexOf(h) === idx);
  for (const href of hrefsWithoutDups) {
    console.log((new URL(href, baseURL)).toString());
  }
});
