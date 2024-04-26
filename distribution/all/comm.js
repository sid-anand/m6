const local = require('../local/local');

const comm = (config) => {
  const context = {};
  context.gid = config.gid || 'all';
  return {
    send: (message, remote, cb) => {
      cb = cb || function() {};
      local.groups.get(context.gid, (e, v) => {
        // assume e is null
        const numNodes = Object.keys(v).length;
        let ctr = 0;
        const emap = {};
        const vmap = {};
        for (const sid of Object.keys(v)) {
          remote.node = v[sid];
          local.comm.send(message, remote, (e, v) => {
            if (v) {
              vmap[sid] = v;
            } else if (e) {
              emap[sid] = e;
            }
            ctr++;
            if (ctr >= numNodes) {
              cb(emap, vmap);
            }
          });
        }
      });
    },
  };
};

module.exports = comm;
