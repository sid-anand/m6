function getNatives() {
  const fs = require('fs');
  const http = require('http');
  const https = require('https');
  const url = require('url');
  const path = require('path');
  const os = require('os');
  const events = require('events');
  const stream = require('stream');
  const util = require('util');
  const querystring = require('querystring');
  const zlib = require('zlib');
  const buffer = require('buffer');
  const childProcess = require('child_process');
  const cluster = require('cluster');
  const dgram = require('dgram');
  const dns = require('dns');
  const http2 = require('http2');
  const v8 = require('v8');

  const natives = [globalThis, fs, http, https, url, path, os,
    events, stream, util, querystring, zlib, buffer, childProcess,
    cluster, dgram, dns, http2, v8];
  const refMap = new Map();
  const seen = new Set();
  let nextId = 0;

  function accumulateMap(native) {
    if (seen.has(native)) {
      return;
    }
    seen.add(native);
    if (typeof native === 'object' || typeof native === 'function') {
      refMap.set(native, nextId);
      nextId++;
      for (const field of Object.getOwnPropertyNames(native)) {
        if (Object.getOwnPropertyDescriptor(native, field) &&
            Object.getOwnPropertyDescriptor(native, field)
                .hasOwnProperty('value') && native[field]) {
          accumulateMap(native[field]);
        }
      }
    }
  }

  for (const native of natives) {
    accumulateMap(native);
  }

  const idMap = new Map(Array.from(refMap, (p) => p.reverse()));
  return [refMap, idMap];
}

const [nativeRefMap, nativeIdMap] = getNatives();

function serialize(object) {
  const refMap = new Map();
  let nextId = 0;

  function serializeRec(object) {
    const repr = {};

    if (nativeRefMap.has(object)) {
      repr.type = 'native';
      repr.val = nativeRefMap.get(object);
      return JSON.stringify(repr);
    }

    switch (typeof object) {
      case 'undefined':
        repr.type = 'undefined';
        break;
      case 'number':
      case 'string':
      case 'boolean':
        repr.type = typeof object;
        repr.val = object.toString();
        break;
      case 'function':
        repr.type = 'function';
        repr.val = object.toString();
        break;
      case 'object':
        if (object === null) {
          repr.type = 'null';
        } else if (object instanceof Date) {
          repr.type = 'date';
          repr.val = object.toJSON();
        } else if (object instanceof Error) {
          repr.type = 'error';
          repr.val = object.message;
        } else if (object instanceof Array) {
          if (refMap.has(object)) {
            repr.type = 'circular';
            repr.val = refMap.get(object);
          } else {
            repr.type = 'array';
            repr.id = nextId;
            nextId++;
            refMap.set(object, repr.id);
            repr.val = JSON.stringify(object.map(serializeRec));
          }
        } else {
          if (refMap.has(object)) {
            repr.type = 'circular';
            repr.val = refMap.get(object);
          } else {
            repr.type = 'object';
            repr.id = nextId;
            nextId++;
            refMap.set(object, repr.id);
            const serializedObj = {};
            for (const field of Object.getOwnPropertyNames(object)) {
              serializedObj[field] = serializeRec(object[field]);
            }
            repr.val = JSON.stringify(serializedObj);
          }
        }
    }
    return JSON.stringify(repr);
  }

  return serializeRec(object, refMap, 0);
}

function deserialize(string) {
  const idMap = new Map();

  function deserializeRec(string, idMap) {
    const repr = JSON.parse(string);
    switch (repr.type) {
      case 'undefined':
        return undefined;
      case 'null':
        return null;
      case 'number':
        return Number(repr.val);
      case 'string':
        return String(repr.val);
      case 'boolean':
        return repr.val === 'true';
      case 'function':
        return eval(`(${repr.val})`);
      case 'date':
        return new Date(repr.val);
      case 'error':
        return Error(repr.val);
      case 'array':
        const singleLevelArr = JSON.parse(repr.val);
        const deserializedArr = [];
        idMap.set(repr.id, deserializedArr);
        for (const el of singleLevelArr) {
          deserializedArr.push(deserializeRec(el, idMap));
        }
        return deserializedArr;
      case 'object':
        const singleLevelObj = JSON.parse(repr.val);
        const deserializedObj = {};
        idMap.set(repr.id, deserializedObj);
        for (const field of Object.getOwnPropertyNames(singleLevelObj)) {
          deserializedObj[field] = deserializeRec(singleLevelObj[field], idMap);
        }
        return deserializedObj;
      case 'circular':
        return idMap.get(repr.val);
      case 'native':
        return nativeIdMap.get(repr.val);
    }
  }

  return deserializeRec(string, idMap);
}

module.exports = {
  serialize: serialize,
  deserialize: deserialize,
};
