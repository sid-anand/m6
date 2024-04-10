const id = require('../util/id');

const groups = {};

const groupsMap = {};

groups.get = (gid, cb) => {
  cb = cb || function() {};
  if (groupsMap[gid]) {
    cb(null, groupsMap[gid]);
  } else {
    cb(new Error('bad gid'), null);
  }
};

groups.put = (gid, nodes, cb) => {
  cb = cb || function() {};
  groupsMap[gid] = nodes;

  global.distribution[gid] = {};
  global.distribution[gid].comm = require('../all/comm')({gid: gid});
  global.distribution[gid].groups = require('../all/groups')({gid: gid});
  global.distribution[gid].routes = require('../all/routes')({gid: gid});
  global.distribution[gid].status = require('../all/status')({gid: gid});
  global.distribution[gid].gossip = require('../all/gossip')({gid: gid});

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
      cb(null, node);
    } else {
      cb(new Error('bad sid'), null);
    }
  } else {
    cb(new Error('bad gid'), null);
  }
};

module.exports = groups;
