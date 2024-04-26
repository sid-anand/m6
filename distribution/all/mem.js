const id = require('../util/id');
const local = require('../local/local');

const selectNode = (name, nodes, hash) => {
  const sortedNodes = nodes.sort((a, b) =>
    id.getNID(a).localeCompare(id.getNID(b)));
  const sortedNids = sortedNodes.map(id.getNID);
  const kid = id.getID(name);
  const nid = hash(kid, sortedNids);
  return [nid, sortedNodes[sortedNids.indexOf(nid)]];
};

const mem = (config) => {
  const context = {};
  context.gid = config.gid || 'all';
  context.hash = config.hash || id.naiveHash;
  return {
    get: (name, cb) => {
      cb = cb || function() {};
      local.groups.get(context.gid, (e, v) => {
        // if name is null, aggregate keys from all nodes
        if (name === null) {
          global.distribution[context.gid].comm.send(
              [{gid: context.gid, key: name}],
              {service: 'mem', method: 'get'}, (e, v) => {
                const allKeys = Object.values(v).flat();
                // maybe do better error-handling here
                cb(e, allKeys);
              });
        } else {
          const [, node] = selectNode(name, Object.values(v), context.hash);
          local.comm.send([{gid: context.gid, key: name}],
              {node, service: 'mem', method: 'get'}, cb);
        }
      });
    },
    put: (obj, name, cb) => {
      cb = cb || function() {};
      local.groups.get(context.gid, (e, v) => {
        // if name is null, set it
        if (name === null) {
          name = id.getID(obj);
        }
        const [, node] = selectNode(name, Object.values(v), context.hash);
        local.comm.send([obj, {gid: context.gid, key: name}],
            {node, service: 'mem', method: 'put'}, cb);
      });
    },
    del: (name, cb) => {
      cb = cb || function() {};
      local.groups.get(context.gid, (e, v) => {
        const [, node] = selectNode(name, Object.values(v), context.hash);
        local.comm.send([{gid: context.gid, key: name}],
            {node, service: 'mem', method: 'del'}, cb);
      });
    },
    reconf: (oldGroup, cb) => {
      cb = cb || function() {};
      local.groups.get(context.gid, (e, newGroup) => {
        global.distribution[context.gid].mem.get(null, (e, keys) => {
          const oldNodes = Object.values(oldGroup);
          const newNodes = Object.values(newGroup);
          for (const key of keys) {
            const [oldNid, oldNode] = selectNode(key, oldNodes, context.hash);
            const [newNid, newNode] = selectNode(key, newNodes, context.hash);
            // No resources need to be relocated from the failed node!
            if (oldNid != newNid && newNodes.map(id.getNID).includes(oldNid)) {
              local.comm.send([{gid: context.gid, key: key}],
                  {node: oldNode, service: 'mem', method: 'del'}, (e, obj) => {
                    local.comm.send([obj, {gid: context.gid, key: key}],
                        {node: newNode, service: 'mem', method: 'put'}, cb);
                  });
            }
          }
        });
      });
    },
  };
};

module.exports = mem;
