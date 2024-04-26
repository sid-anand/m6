const local = require('../local/local');

const groups = (config) => {
  const context = {};
  context.gid = config.gid || 'all';
  return {
    get: (gid, cb) => {
      cb = cb || function() {};
      global.distribution[context.gid].comm.send([gid],
          {service: 'groups', method: 'get'}, cb);
    },
    put: (config, nodes, cb) => {
      cb = cb || function() {};
      local.groups.put(config, nodes, (e, v) => {
        // ignore e, v
        global.distribution[context.gid].comm.send([config, nodes],
            {service: 'groups', method: 'put'}, cb);
      });
    },
    del: (gid, cb) => {
      cb = cb || function() {};
      // need to comm.send before deleting locally
      global.distribution[context.gid].comm.send([gid],
          {service: 'groups', method: 'del'}, (eall, vall) => {
            local.groups.del(gid, (e, v) => {
              // ignore e, v
              cb(eall, vall);
            });
          });
    },
    add: (gid, node, cb) => {
      cb = cb || function() {};
      local.groups.add(gid, node, (e, v) => {
        // ignore e, v
        global.distribution[context.gid].comm.send([gid, node],
            {service: 'groups', method: 'add'}, cb);
      });
    },
    rem: (gid, nodename, cb) => {
      cb = cb || function() {};
      local.groups.rem(gid, nodename, (e, v) => {
        // ignore e, v
        global.distribution[context.gid].comm.send([gid, nodename],
            {service: 'groups', method: 'rem'}, cb);
      });
    },
  };
};

module.exports = groups;
