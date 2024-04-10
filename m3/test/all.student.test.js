global.nodeConfig = {ip: '127.0.0.1', port: 7070};
const distribution = require('../distribution');
const id = distribution.util.id;

const groupsTemplate = require('../distribution/all/groups');
const mygroupGroup = {};

let localServer = null;

beforeAll((done) => {
  const n1 = {ip: '127.0.0.1', port: 7000};
  const n2 = {ip: '127.0.0.1', port: 7001};
  const n3 = {ip: '127.0.0.1', port: 7002};

  // First, stop the nodes if they are running
  let remote = {service: 'status', method: 'stop'};
  remote.node = n1;
  distribution.local.comm.send([], remote, (e, v) => {
    remote.node = n2;
    distribution.local.comm.send([], remote, (e, v) => {
      remote.node = n3;
      distribution.local.comm.send([], remote, (e, v) => {
      });
    });
  });

  mygroupGroup[id.getSID(n1)] = n1;
  mygroupGroup[id.getSID(n2)] = n2;
  mygroupGroup[id.getSID(n3)] = n3;

  // Now, start the base listening node
  distribution.node.start((server) => {
    localServer = server;
    // Now, start the nodes
    distribution.local.status.spawn(n1, (e, v) => {
      distribution.local.status.spawn(n2, (e, v) => {
        distribution.local.status.spawn(n3, (e, v) => {
          groupsTemplate({gid: 'mygroup'})
              .put('mygroup', mygroupGroup, (e, v) => {
                done();
              });
        });
      });
    });
  });
});

afterAll((done) => {
  distribution.mygroup.status.stop((e, v) => {
    localServer.close();
    done();
  });
});

test('counts', (done) => {
  const [n1, ,] = Object.values(mygroupGroup);

  distribution.mygroup.status.get('counts', (e, v) => {
    expect(e).toEqual({});
    expect(v).toBe(0);
    const remote = {node: n1, service: 'status', method: 'get'};
    distribution.local.comm.send(['nid'], remote, (e, v) => {
      distribution.mygroup.status.get('counts', (e, v) => {
        expect(e).toEqual({});
        expect(v).toBe(0);
        done();
      });
    });
  });
});

test('heapTotal', (done) => {
  const [n1, n2, n3] = Object.values(mygroupGroup);
  const remote = {service: 'status', method: 'get'};

  distribution.mygroup.status.get('heapTotal', (e, v) => {
    remote.node = n1;
    distribution.local.comm.send(['heapTotal'], remote, (e1, v1) => {
      remote.node = n2;
      distribution.local.comm.send(['heapTotal'], remote, (e2, v2) => {
        remote.node = n3;
        distribution.local.comm.send(['heapTotal'], remote, (e3, v3) => {
          expect(e).toEqual({});
          expect(v).toEqual(v1 + v2 + v3);
          done();
        });
      });
    });
  });
});

test('gossip.at/del', (done) => {
  let ctr = 0;
  const f = () => ctr++;
  distribution.mygroup.gossip.at(5000, f, (e, v) => {
    expect(e).toBeFalsy();
    expect(typeof v).toBe('object');
    distribution.mygroup.gossip.del(v, (e, v) => {
      expect(e).toBeFalsy();
      expect(v).toBeFalsy();
      expect(ctr).toBe(0);
      done();
    });
  });
});

test('all.routes.put', (done) => {
  const [n1, ,] = Object.values(mygroupGroup);

  const echoService = {};
  echoService.echo = () => {
    return 'echo!';
  };

  distribution.mygroup.routes.put(echoService, 'echo', (e, v) => {
    const remote = {node: n1, service: 'routes', method: 'get'};
    distribution.local.comm.send(['echo'], remote, (e, v) => {
      expect(e).toBeFalsy();
      expect(v.echo()).toBe('echo!');
      done();
    });
  });
});

test('all.groups.del', (done) => {
  let g = {
    '507aa': {ip: '127.0.0.1', port: 8080},
    '12ab0': {ip: '127.0.0.1', port: 8081},
  };
  distribution.mygroup.groups.put('browncs', g, (e, v) => {
    expect(e).toEqual({});
    Object.keys(mygroupGroup).forEach((sid) => {
      expect(v[sid]).toEqual(g);
    });
    expect(distribution.browncs).toBeDefined();
    distribution.mygroup.groups.del('browncs', (e, v) => {
      expect(distribution.browncs).toBeUndefined();
      done();
    });
  });
});
