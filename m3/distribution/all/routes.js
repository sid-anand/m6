const routes = (config) => {
  const context = {};
  context.gid = config.gid || 'all';
  return {
    put: (obj, name, cb) => {
      cb = cb || function() {};
      distribution[context.gid].comm.send([obj, name],
          {service: 'routes', method: 'put'}, cb);
    },
  };
};

module.exports = routes;
