/*
Service  Description                                Methods
comm     A message communication interface          send
gossip   The receiver part of the gossip protocol   recv
groups   A mapping from group names to nodes        get, put, del, add, rem
mem      An ephemeral (in-memory) store             get, put, del
routes   A mapping from names to functions          get, put
status   Status and control of the current node     get, spawn, stop
store    A persistent store                         get, put, append, del
*/

/* Comm Service */
const comm = require('./comm');

/* Gossip Service */
const gossip = require('./gossip');

/* Groups Service */
const groups = require('./groups');

/* Mem Service */
const mem = require('./mem');

/* Routes Service */
const routes = require('./routes');

/* Status Service */
const status = require('./status');

/* Store Service */
const store = require('./store');

module.exports = {
  comm: comm,
  gossip: gossip,
  groups: groups,
  mem: mem,
  routes: routes,
  status: status,
  store: store,
};
