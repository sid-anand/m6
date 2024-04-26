/*
Service   Description                            Methods
comm      A message communication interface      send
gossip    Status and information dissemination   send, at, del
groups    A mapping from group names to nodes    get, put, del, add, rem
mem       An ephemeral (in-memory) store         get, put, del, reconf
mr        A map-reduce implementation            exec
routes    A mapping from names to functions      put
status    Information about the current group    get, stop, spawn
store     A persistent store                     get, put, append, del, reconf
*/

/* Comm Service */
const comm = require('./comm');

/* Gossip Service */
const gossip = require('./gossip');

/* Groups Service */
const groups = require('./groups');

/* Mem Service */
const mem = require('./mem');

/* Map-Reduce Service */
const mr = require('./mr');

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
  mr: mr,
  routes: routes,
  status: status,
  store: store,
};
