const path = require('path');
const id = require('../util/id');
const wire = require('../util/wire');
const {spawn} = require('node:child_process');

const status = {};

global.moreStatus = {
  sid: id.getSID(global.nodeConfig),
  nid: id.getNID(global.nodeConfig),
  counts: 0,
};

status.get = function(configuration, callback) {
  callback = callback || function() {};

  if (configuration in global.nodeConfig) {
    callback(null, global.nodeConfig[configuration]);
  } else if (configuration in moreStatus) {
    callback(null, moreStatus[configuration]);
  } else if (configuration === 'heapTotal') {
    callback(null, process.memoryUsage().heapTotal);
  } else if (configuration === 'heapUsed') {
    callback(null, process.memoryUsage().heapUsed);
  } else {
    callback(new Error('Status key not found'));
  }
};

status.spawn = function(node, cb) {
  cb = cb || function() {};
  node.onStart = node.onStart || function() {};
  const rpc = wire.createRPC(wire.toAsync(cb));
  const composedStr = `
    let onStart = ${node.onStart.toString()};
    let cbRPC = ${rpc.toString()};
    onStart();
    cbRPC();
  `;
  node.onStart = new Function(composedStr);
  const serializedConfig = global.distribution.util.serialize(node);
  spawn('node', [path.join(__dirname, '../../distribution.js'),
    '--config', serializedConfig]);
};

status.stop = function(cb) {
  cb = cb || function() {};
  cb(null, global.nodeConfig);
  process.exit(0);
};

module.exports = status;
