/*
Service   Description                            Methods
comm      A message communication interface      send
groups    A mapping from group names to nodes    get,put, add, rem, del
routes    A mapping from names to functions      put
status    Information about the current group    get, stop, spawn
gossip    Status and information dissemination   send, at, del
*/

/* Comm Service */
const comm = require('./comm');

/* Groups Service */
const groups = require('./groups');

/* Routes Service */
const routes = require('./routes');

/* Status Service */
const status = require('./status');

/* Gossip Service */
const gossip = require('./gossip');

module.exports = {
  comm: comm,
  groups: groups,
  status: status,
  routes: routes,
  gossip: gossip,
};
