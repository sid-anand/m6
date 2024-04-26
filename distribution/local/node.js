const http = require('http');
const url = require('url');

let local = require('../local/local');
const serialization = require('../util/serialization');

function isValidBody(body) {
  error = undefined;
  if (body.length === 0) {
    return new Error('No body');
  }

  try {
    body = JSON.parse(body);
  } catch (error) {
    return error;
  }

  return error;
}

const start = function(onStart) {
  const server = http.createServer((req, res) => {
    if (req.method !== 'PUT') {
      res.end(serialization.serialize(new Error('Method not allowed!')));
      return;
    }

    const pathname = url.parse(req.url).pathname;
    const [, service, method] = pathname.split('/');

    // console.log(`[SERVER] (${global.nodeConfig.ip}:${global.nodeConfig.port})
    //     Request: ${service}:${method}`);

    let body = [];

    req.on('data', (chunk) => {
      body.push(chunk);
    });

    req.on('end', () => {
      body = Buffer.concat(body).toString();

      let error;

      if (error = isValidBody(body)) {
        res.end(serialization.serialize(error));
        return;
      }

      // probably don't need this, right? unless data is in JSON format
      // body = JSON.parse(body);
      body = serialization.deserialize(body);
      let args = body;

      // console.log(`[SERVER] Args: ${JSON.stringify(args)}`);

      local.routes.get(service, (error, service) => {
        if (error) {
          res.end(serialization.serialize(error));
          console.error(error);
          return;
        }
        service[method](...args, (e, v) => {
          res.end(serialization.serialize([e, v]));
        });
      });
    });
  });

  server.listen(global.nodeConfig.port, global.nodeConfig.ip, () => {
    console.log(`Server running at http://${global.nodeConfig.ip}:${global.nodeConfig.port}/`);
    onStart(server);
  });
};

module.exports = {
  start: start,
};
