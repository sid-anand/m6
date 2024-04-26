const seen = new Set();

const gossip = {
  recv: (...args) => {
    const cb = args.pop() || function() {};
    if (!seen.has(args)) {
      seen.add(args);
      const remote = args.pop() || {};
      const {service, method} = remote;
      // hacky solution to be able to call gossip.send
      const gid = args.pop() || '';
      // call the local service method
      global.distribution.local[service][method](...args, (e, v) => {
        // gossip again
        global.distribution[gid].gossip.send(args, remote, cb);
      });
    } else {
      cb(null, null);
    }
  },
};

module.exports = gossip;
