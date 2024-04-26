const routesStore = {};

const routes = {
  get: function(routeName, callback) {
    if (!callback) {
      return;
    }
    if (routeName in routesStore) {
      let routeFunction = routesStore[routeName];
      callback(null, routeFunction);
    } else {
      callback(new Error('Service not found in routes'));
    }
  },
  put: function(data, routeName, callback) {
    routesStore[routeName] = data;
    if (callback) {
      callback(null, routeName);
    }
  },
};

routesStore.comm = require('./comm');
global.toLocal = {};
routesStore.rpc = global.toLocal;
routesStore.gossip = require('./gossip');
routesStore.groups = require('./groups');
routesStore.mem = require('./mem');
routesStore.routes = routes;
routesStore.status = require('./status');
routesStore.store = require('./store');

module.exports = routes;
