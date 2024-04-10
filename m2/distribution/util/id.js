var crypto = require('crypto');
var serialization = require('../util/serialization');

// The ID is the SHA256 hash of the JSON representation of the object
function getID(obj) {
  const hash = crypto.createHash('sha256');
  hash.update(serialization.serialize(obj));
  return hash.digest('hex');
}

// The NID is the SHA256 hash of the JSON representation of the node
function getNID(node) {
  const hash = crypto.createHash('sha256');
  hash.update(serialization.serialize(node));
  return hash.digest('hex');
}

// The SID is the first 5 characters of the NID
function getSID(node) {
  return getNID(node).substring(0, 5);
}

module.exports = {
  getNID: getNID,
  getSID: getSID,
  getID: getID,
};
