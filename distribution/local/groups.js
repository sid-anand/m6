const id = require('../util/id');

const groups = {};

const groupsMap = {};
groupsMap.all = {};

groups.get = (gid, cb) => {
  cb = cb || function() {};
  if (groupsMap[gid]) {
    cb(null, groupsMap[gid]);
  } else {
    cb(new Error('bad gid'), null);
  }
};

groups.put = (config, nodes, cb) => {
  cb = cb || function() {};

  let gid;
  if (typeof config === 'string') {
    gid = config;
  } else {
    gid = config.gid;
  }

  groupsMap[gid] = nodes;

  Object.keys(nodes).forEach((key) => {
    groupsMap.all[id.getSID(nodes[key])] = nodes[key];
  });

  global.distribution[gid] = {};
  global.distribution[gid].comm = require('../all/comm')(config);
  global.distribution[gid].gossip = require('../all/gossip')(config);
  global.distribution[gid].groups = require('../all/groups')(config);
  global.distribution[gid].mem = require('../all/mem')(config);
  global.distribution[gid].mr = require('../all/mr')(config);
  global.distribution[gid].routes = require('../all/routes')(config);
  global.distribution[gid].status = require('../all/status')(config);
  global.distribution[gid].store = require('../all/store')(config);

  cb(null, nodes);
};

groups.del = (gid, cb) => {
  cb = cb || function() {};
  if (groupsMap[gid]) {
    const nodes = groupsMap[gid];
    delete groupsMap[gid];

    // should this be here???
    delete distribution[gid];

    cb(null, nodes);
  } else {
    cb(new Error('bad gid'), null);
  }
};

groups.add = (gid, node, cb) => {
  cb = cb || function() {};
  if (groupsMap[gid]) {
    const sid = id.getSID(node);
    groupsMap[gid][sid] = node;
    groupsMap.all[sid] = node;
    cb(null, node);
  } else {
    cb(new Error('bad gid'), null);
  }
};

groups.rem = (gid, nodename, cb) => {
  cb = cb || function() {};
  if (groupsMap[gid]) {
    if (groupsMap[gid][nodename]) {
      const node = groupsMap[gid][nodename];
      delete groupsMap[gid][nodename];
      delete groupsMap.all[nodename];
      cb(null, node);
    } else {
      cb(new Error('bad sid'), null);
    }
  } else {
    cb(new Error('bad gid'), null);
  }
};

module.exports = groups;
