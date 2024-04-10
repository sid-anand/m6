const local = require('../local/local');

const gossip = (config) => {
  const context = {};
  context.gid = config.gid || 'all';
  context.subset = config.subset || ((lst) => 3);
  return {
    send: (message, remote, cb) => {
      cb = cb || function() {};
      const gossipRemote = {service: 'gossip', method: 'recv'};
      local.groups.get(context.gid, (e, v) => {
        // assume e is null
        const sids = Object.keys(v);
        const k = context.subset(sids);
        const randomSids = [];
        while (randomSids.length < k && randomSids.length < sids.length) {
          const randomIndex = Math.floor(Math.random() * sids.length);
          if (!randomSids.includes(sids[randomIndex])) {
            randomSids.push(sids[randomIndex]);
          }
        }
        message.push(context.gid);
        message.push(remote);
        for (const sid of randomSids) {
          gossipRemote.node = v[sid];
          local.comm.send(message, gossipRemote, () => {});
        }
        cb(null, null);
      });
    },
    at: (interval, func, cb) => {
      cb = cb || function() {};
      const id = setInterval(func, interval);
      cb(null, id);
    },
    del: (id, cb) => {
      cb = cb || function() {};
      clearInterval(id);
      cb(null, null);
    },
  };
};

module.exports = gossip;
