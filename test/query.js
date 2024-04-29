const fs = require('fs');
const readline = require('readline');

global.nodeConfig = {ip: '127.0.0.1', port: 7071}; // This may become redundant
const distribution = require('../distribution');
const id = distribution.util.id;

const groupsTemplate = require('../distribution/all/groups');
const nodeGroup = {};
let localServer = null;
const n1 = {ip: '127.0.0.1', port: 7109};


const doInitialize = (done) => {
  /* Stop the nodes if they are running */

  nodeGroup[id.getSID(n1)] = n1;

  const startNodes = (cb) => {
    distribution.local.status.spawn(n1, (e, v) => {
      cb();
    });
  };

  distribution.node.start((server) => {
    localServer = server;

    const groupConfig = {gid: 'group'};
    startNodes(() => {
      groupsTemplate(groupConfig).put(groupConfig, nodeGroup, (e, v) => {
        done();
      });
    });
  });
};

const n2 = {ip: '127.0.0.1', port: 7110};
const n3 = {ip: '127.0.0.1', port: 7111};
const n4 = {ip: '127.0.0.1', port: 7112};

const teardown = (done) => {
  let remote = {service: 'status', method: 'stop'};
  remote.node = n1;
  distribution.local.comm.send([], remote, (e, v) => {
    remote.node = n2;
    distribution.local.comm.send([], remote, (e, v) => {
      remote.node = n3;
      distribution.local.comm.send([], remote, (e, v) => {
        remote.node = n4;
        distribution.local.comm.send([], remote, (e, v) => {
          localServer.close();
          done();
        });
      });
    });
  });
};

// If we have a UI, we can link this somehow
const handleQuery = (query) => {
  let maxNgrams = 3; // TODO: decide on whats the max ngram
  // TODO: for a given query generate ngrams and query all ngrams and find a
  // way to compose results ideally
  if (query.length >= maxNgrams) {
    const words = query.split(' ');
    const firstNWords = words.slice(0, maxNgrams);
    query = firstNWords.join(' ');
    distribution.group.store.get(query, (e, v) => {
      // the whole query can be an ngram
      // v would be the indices in the KV store idea. v[0] is best match? order?
      console.log(v);
      // Result should be v.val which is the url
    });
  } else {
    distribution.group.store.get(query, (e, v) => {
      console.log(v);
    });
  }
};
doInitialize(() => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter your query: ', (query) => {
    console.log(query);
    if (query.startsWith('teardown')) {
      // TODO: Make this a continuous while loop so many queries can be sent
      rl.close();
      teardown(() => {
        console.log('done');
      });
      return;
    }
    handleQuery(query); // Call your query handling function
    rl.close();
  });
});
