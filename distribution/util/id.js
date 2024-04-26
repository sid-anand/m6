const assert = require('assert');
var crypto = require('crypto');

// The ID is the SHA256 hash of the JSON representation of the object
function getID(obj) {
  const hash = crypto.createHash('sha256');
  hash.update(JSON.stringify(obj));
  return hash.digest('hex');
}

// The NID is the SHA256 hash of the JSON representation of the node
function getNID(node) {
  node = {ip: node.ip, port: node.port};
  return getID(node);
}

// The SID is the first 5 characters of the NID
function getSID(node) {
  return getNID(node).substring(0, 5);
}

function idToNum(id) {
  let n = parseInt(id, 16);
  assert(!isNaN(n), 'idToNum: id is not in KID form!');
  return n;
}

function naiveHash(kid, nids) {
  // tests require `nids` to be mutated
  nids.sort();
  return nids[idToNum(kid) % nids.length];
}

function consistentHash(kid, nids) {
  // tests require `nids` to be mutated
  nids.sort();
  const kidNum = idToNum(kid);
  const nidNums = nids.map(idToNum);
  for (let i = 0; i < nidNums.length - 1; i++) {
    if (kidNum < nidNums[i]) {
      return nids[i];
    }
  }
  return nids[0];
}

function rendezvousHash(kid, nids) {
  // tests require `nids` to be mutated (not even needed here)
  nids.sort();
  const hashes = nids.map((nid) => idToNum(getID(kid + nid)));
  const maxIndex = hashes.indexOf(Math.max(...hashes));
  return nids[maxIndex];
}

module.exports = {
  getNID: getNID,
  getSID: getSID,
  getID: getID,
  idToNum: idToNum,
  naiveHash: naiveHash,
  consistentHash: consistentHash,
  rendezvousHash: rendezvousHash,
};
