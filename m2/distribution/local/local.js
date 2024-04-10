const http = require('http');

const serialization = require('../util/serialization');
const id = require('../util/id');

const node = global.config;

/*

Service  Description                           Methods
status   statusrmation about the current node  get
routes   A mapping from names to functions     get, put
comm     A message communication interface     send

*/

const local = {
  status: {},
  routes: {},
  comm: {},
  messageCount: 0,
};

function statusGet(...args) {
  // defaults
  let prop = 'nid';
  let cb = console.log;
  if (args.length === 2) {
    prop = args[0];
    cb = args[1];
  } else if (args.length === 1) {
    cb = args[0];
  }

  switch (prop) {
    case 'nid':
      cb(null, id.getNID(node));
      break;
    case 'sid':
      cb(null, id.getSID(node));
      break;
    case 'ip':
      cb(null, node.ip);
      break;
    case 'port':
      cb(null, node.port);
      break;
    case 'counts':
      cb(null, local.messageCount);
      break;
    default:
      cb(new Error('bad status property'), null);
  }
}

function routesGet(...args) {
  // defaults
  let name = 'status';
  let cb = console.log;
  if (args.length === 2) {
    name = args[0];
    cb = args[1];
  } else if (args.length === 1) {
    cb = args[0];
  }

  if (typeof name === 'string' && local.hasOwnProperty(name)) {
    cb(null, local[name]);
  } else {
    cb(new Error('bad route'), null);
  }
}

function routesPut(...args) {
  // defaults
  let obj = {};
  let name = 'route';
  let cb = console.log;
  if (args.length === 3) {
    obj = args[0];
    name = args[1];
    cb = args[2];
  } else if (args.length === 2) {
    name = args[0];
    cb = args[1];
  } else if (args.length === 1) {
    cb = args[0];
  }

  if (typeof name === 'string') {
    local[name] = obj;
    cb(null, null);
  } else {
    cb(new Error('bad route'), null);
  }
}

function commSend(...args) {
  // defaults
  let message = [];
  let remote = {
    node: {
      ip: '127.0.0.1',
      port: 8080,
    },
    service: 'status',
    method: 'get',
  };
  let cb = console.log;
  if (args.length === 3) {
    message = args[0];
    remote = args[1];
    cb = args[2];
  } else if (args.length === 2) {
    remote = args[0];
    cb = args[1];
  } else if (args.length === 1) {
    cb = args[0];
  }

  const {node: remoteNode, service, method} = remote;
  const options = {
    host: remoteNode.ip,
    port: remoteNode.port,
    path: `/${service}/${method}`,
    method: 'PUT',
  };
  const req = http.request(options, (res) => {
    let body = [];
    res
        .on('data', (chunk) => {
          body.push(chunk);
        })
        .on('end', () => {
          body = Buffer.concat(body).toString();
          const [e, v] = serialization.deserialize(body);
          cb(e, v);
        });
  });
  req.on('error', (e) => {
    console.log('problem with request: ' + e.message);
  });
  req.write(serialization.serialize(message));
  req.end();
}

global.toLocal = {};

local.status.get = statusGet;
local.routes.get = routesGet;
local.routes.put = routesPut;
local.comm.send = commSend;
local.rpc = global.toLocal;
module.exports = local;
