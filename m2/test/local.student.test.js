const {
  // performance,
  PerformanceObserver,
} = require('perf_hooks');

let distribution;
let local;

let routes;
let comm;
let status;

let id;
let node;

let lastPort = 8080;

beforeEach(() => {
  jest.resetModules();

  global.config = {
    ip: '127.0.0.1',
    port: lastPort++, // Avoid port conflicts
  };

  distribution = require('../distribution');
  local = distribution.local;

  status = local.status;
  routes = local.routes;
  comm = local.comm;

  id = distribution.util.id;
  wire = distribution.util.wire;

  node = global.config;
});

test('RPC with args', (done) => {
  let n = 0;

  const add = (x) => {
    return (n += x);
  };

  const addRPC = wire.createRPC(wire.toAsync(add));

  const rpcService = {
    addRPC: addRPC,
  };

  distribution.node.start((server) => {
    routes.put(rpcService, 'rpcService', (e, v) => {
      routes.get('rpcService', (e, s) => {
        expect(e).toBeFalsy();
        s.addRPC(1, (e, v) => {
          s.addRPC(2, (e, v) => {
            s.addRPC(3, (e, v) => {
              server.close();
              expect(e).toBeFalsy();
              expect(v).toBe(6);
              done();
            });
          });
        });
      });
    });
  });
});

test('default status.get', (done) => {
  status.get((e, v) => {
    expect(e).toBeFalsy();
    expect(v).toBe(id.getNID(node));
    done();
  });
});

test('default routes.get', (done) => {
  routes.get((e, v) => {
    expect(e).toBeFalsy();
    expect(v).toBe(status);
    done();
  });
});

test('accurate message count', (done) => {
  local.messageCount++;
  status.get('counts', (e, v) => {
    expect(e).toBeFalsy();
    expect(v).toBe(1);
    local.messageCount--;
    done();
  });
});

test('RPC with comm.send', (done) => {
  const perfObserver = new PerformanceObserver((items) => {
    items.getEntries().forEach((entry) => {
      console.log(entry);
    });
  });
  perfObserver.observe({entryTypes: ['measure'], buffer: true});

  let n = 0;
  let f = () => ++n;

  distribution.node.start((server) => {
    let r1 = {node: node, service: 'routes', method: 'put'};
    let m1 = [{do: wire.createRPC(wire.toAsync(f))}, 'muService'];
    comm.send(m1, r1, (e, v) => {
      let r2 = {node: node, service: 'muService', method: 'do'};
      let m2 = [];
      // performance.mark('request-RPC');
      comm.send(m2, r2, (error, result) => {
        // performance.mark('complete-RPC');
        // performance.measure('RPC', 'request-RPC', 'complete-RPC');
        server.close();
        expect(error).toBeFalsy();
        expect(result).toBe(1);
        done();
      });
    });
  });
});
