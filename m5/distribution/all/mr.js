let mapReduceCounter = 0;

const mr = function(config) {
  let context = {};
  context.gid = config.gid || 'all';

  return {
    exec: (configuration, callback) => {
      const mrService = {
        map: async (keys, mapper, gid, cb) => {
          console.log("keys", keys);
          let ctr = 0;
          const mappedResults = {};
          for (const key of keys) {
            global.distribution.local.store.get({key: key, gid: gid},
                async (e, value) => {
                  if (!e) {
                    // if key is found on the node (often might not be)
                    let mapped = await mapper(key, value);
                    console.log("mapped result", mapped);
                    if (!(mapped instanceof Array)) {
                      mapped = [mapped];
                    }
                    for (const mappedPair of mapped) {
                      const intKey = Object.keys(mappedPair)[0];
                      const intValue = mappedPair[intKey];
                      if (!mappedResults[intKey]) {
                        mappedResults[intKey] = [];
                      }
                      mappedResults[intKey].push(intValue);
                    }
                  }
                  ctr++;
                  if (ctr === keys.length) {
                    global.distribution.local.store.put(mappedResults,
                        {key: 'mappedResults', gid: gid}, (e, v) => {
                          // notify the coordinator
                          cb(null, null);
                        });
                  }
                });
          }
          if (keys.length === 0) {
            global.distribution.local.store.put(mappedResults,
                {key: 'mappedResults', gid: gid}, (e, v) => {
                  // notify the coordinator
                  cb(null, null);
                });
          }
        },
        shuffle: (compactor, gid, cb) => {
          // get and delete `mappedResults` file
          global.distribution.local.store.del({key: 'mappedResults', gid: gid},
              (e, mappedResults) => {
                let ctr = 0;
                for (const key of Object.keys(mappedResults)) {
                  let obj = {};
                  obj[key] = mappedResults[key];
                  // optionally perform the compaction optimization
                  if (compactor) {
                    obj = compactor(key, obj[key]);
                    obj[key] = [obj[key]];
                  }
                  global.distribution[gid].store.append(obj, 'shuffledResults',
                      (e, v) => {
                        ctr++;
                        if (ctr === Object.keys(mappedResults).length) {
                          // notify the coordinator
                          cb(null, null);
                        }
                      });
                }
                if (Object.keys(mappedResults).length === 0) {
                  // notify the coordinator
                  cb(null, null);
                }
              });
        },
        reduce: (reducer, gid, cb) => {
          // get and delete `shuffledResults` file
          global.distribution.local.store.del(
              {key: 'shuffledResults', gid: gid}, (e, shuffledResults) => {
                const reducedArr = [];
                if (!e) {
                  // if this node has shuffledResults (might not be the case)
                  for (const key of Object.keys(shuffledResults)) {
                    const reduced = reducer(key, shuffledResults[key]);
                    reducedArr.push(reduced);
                  }
                }
                // notify the coordinator
                cb(null, reducedArr);
              });
        },
      };

      // change this to a different name for each MapReduce invocation!!!
      const mrId = `mr-${mapReduceCounter}`;
      mapReduceCounter++;
      global.distribution[context.gid].routes.put(mrService, mrId, (e, v) => {
        global.distribution[context.gid].comm.send(
            [configuration.keys, configuration.map, context.gid],
            {service: mrId, method: 'map'}, (e, v) => {
              global.distribution[context.gid].comm.send(
                  [configuration.compact, context.gid],
                  {service: mrId, method: 'shuffle'}, (e, v) => {
                    global.distribution[context.gid].comm.send(
                        [configuration.reduce, context.gid],
                        {service: mrId, method: 'reduce'}, (e, v) => {
                          const allReduced = Object.values(v).flat();
                          callback(null, allReduced);
                        });
                  });
            });
      });
    },
  };
};

module.exports = mr;
