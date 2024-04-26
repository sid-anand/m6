const id = require('../util/id');

const mem = {};

// maps gid to sub-maps
const sharedMemory = {};
// separate local memory
const localMemory = {};

mem.get = (name, cb) => {
  if (name === null) {
    cb(null, Object.keys(localMemory));
  } else if (typeof name === 'object') {
    if (!sharedMemory[name.gid]) {
      cb(new Error('no memory for gid'), null);
    } else if (name.key === null) {
      cb(null, Object.keys(sharedMemory[name.gid]));
    } else if (!sharedMemory[name.gid][name.key]) {
      cb(new Error('bad name'), null);
    } else {
      cb(null, sharedMemory[name.gid][name.key]);
    }
  } else if (localMemory[name]) {
    cb(null, localMemory[name]);
  } else {
    cb(new Error('bad name'), null);
  }
};

mem.put = (obj, name, cb) => {
  if (name === null) {
    name = id.getID(obj);
  }
  if (typeof name === 'object') {
    if (name.key === null) {
      name.key = id.getID(obj);
    }
    if (!sharedMemory[name.gid]) {
      sharedMemory[name.gid] = {};
    }
    sharedMemory[name.gid][name.key] = obj;
    cb(null, obj);
  } else {
    localMemory[name] = obj;
    cb(null, obj);
  }
};

mem.del = (name, cb) => {
  if (typeof name === 'object') {
    if (!sharedMemory[name.gid]) {
      cb(new Error('no memory for gid'), null);
    } else if (!sharedMemory[name.gid][name.key]) {
      cb(new Error('bad name'), null);
    } else {
      const obj = sharedMemory[name.gid][name.key];
      delete sharedMemory[name.gid][name.key];
      cb(null, obj);
    }
  } else {
    if (localMemory[name]) {
      const obj = localMemory[name];
      delete localMemory[name];
      cb(null, obj);
    } else {
      cb(new Error('bad name'), null);
    }
  }
};

module.exports = mem;
