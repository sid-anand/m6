const local = require('../local/local');

const status = (config) => {
  const context = {};
  context.gid = config.gid || 'all';
  return {
    get: (prop, cb) => {
      global.distribution[context.gid].comm.send([prop],
          {service: 'status', method: 'get'}, (e, v) => {
            if (prop === 'counts' || prop === 'heapTotal' ||
                prop === 'heapUsed') {
              const sum = Object.values(v).reduce((a, b) => a + b, 0);
              cb(e, sum);
            } else {
              cb(e, v);
            }
          });
    },
    stop: (cb) => {
      global.distribution[context.gid].comm.send([],
          {service: 'status', method: 'stop'}, cb);
    },
    spawn: (node, cb) => {
      local.status.spawn(node, (e, v) => {
        // ignore e, v
        global.distribution[context.gid].groups.add(
            context.gid, node, (e, v) => {
              // ignore e, v
              cb(null, node);
            });
      });
    },
  };
};

module.exports = status;
