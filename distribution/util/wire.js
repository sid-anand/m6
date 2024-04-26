const serialization = require('../util/serialization');

global.nextFunPtr = 0;

function createRPC(func) {
  const funPtr = (global.nextFunPtr++).toString();
  global.toLocal[funPtr] = func;

  function stub(...args) {
    const cb = args.pop() || function() {};
    const remote = {
      node: '__NODE_INFO__',
      service: 'rpc',
      method: '__METHOD_ID__',
    };
    global.distribution.local.comm.send(args, remote, cb);
  }

  let serializedStub = serialization.serialize(stub);
  serializedStub = serializedStub.replace('\'__NODE_INFO__\'',
      `{ip: \'${global.nodeConfig.ip}\', port: ${global.nodeConfig.port}}`);
  serializedStub = serializedStub.replace('__METHOD_ID__', funPtr);
  return serialization.deserialize(serializedStub);
}

/*
  The toAsync function converts a synchronous function that returns a value
  to one that takes a callback as its last argument and returns the value
  to the callback.
*/
function toAsync(func) {
  return function(...args) {
    const callback = args.pop() || function() {};
    try {
      const result = func(...args);
      callback(null, result);
    } catch (error) {
      callback(error);
    }
  };
}

module.exports = {
  createRPC: createRPC,
  toAsync: toAsync,
};
