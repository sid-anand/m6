const http = require('http');
const serialization = require('../util/serialization');

const comm = {
  send: (message, remote, cb) => {
    const {node: remoteNode, service, method} = remote;
    const options = {
      host: remoteNode.ip,
      port: remoteNode.port,
      path: `/${service}/${method}`,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': serialization.serialize(message).length,
      },
    };
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        if (cb) {
          cb(...serialization.deserialize(data));
        }
      });
      res.on('error', (error) => {
        if (cb) {
          cb(new Error('Error on response'));
        }
      });
    });
    req.on('error', (e) => {
      if (cb) {
        cb(new Error('Error on request'));
      }
    });
    req.write(serialization.serialize(message));
    req.end();
  },
};

module.exports = comm;
