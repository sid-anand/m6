#!/usr/bin/env node

// Extract text from a web page

const {convert} = require('html-to-text');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
});

// TODO Add some code
let domString = '';

rl.on('line', (line) => {
  // TODO Add some code
  domString += (line + '\n');
});

rl.on('close', () => {
  // TODO Add some code
  console.log(convert(domString));
});
