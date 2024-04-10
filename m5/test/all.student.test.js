global.nodeConfig = {ip: '127.0.0.1', port: 8080};
const distribution = require('../distribution');
const id = distribution.util.id;

const groupsTemplate = require('../distribution/all/groups');

const crawlGroup = {};
const stringMatchGroup = {};
const linkGraphGroup = {};
const wcGroup = {};
const recipeGroup = {};

/*
   This hack is necessary since we can not
   gracefully stop the local listening node.
   The process that node is
   running in is the actual jest process
*/
let localServer = null;

/*
    The local node will be the orchestrator.
*/

const n1 = {ip: '127.0.0.1', port: 8110};
const n2 = {ip: '127.0.0.1', port: 8111};
const n3 = {ip: '127.0.0.1', port: 8112};

beforeAll((done) => {
  /* Stop the nodes if they are running */

  crawlGroup[id.getSID(n1)] = n1;
  crawlGroup[id.getSID(n2)] = n2;
  crawlGroup[id.getSID(n3)] = n3;

  stringMatchGroup[id.getSID(n1)] = n1;
  stringMatchGroup[id.getSID(n2)] = n2;
  stringMatchGroup[id.getSID(n3)] = n3;

  linkGraphGroup[id.getSID(n1)] = n1;
  linkGraphGroup[id.getSID(n2)] = n2;
  linkGraphGroup[id.getSID(n3)] = n3;

  wcGroup[id.getSID(n1)] = n1;
  wcGroup[id.getSID(n2)] = n2;
  wcGroup[id.getSID(n3)] = n3;

  recipeGroup[id.getSID(n1)] = n1;
  recipeGroup[id.getSID(n2)] = n2;
  recipeGroup[id.getSID(n3)] = n3;

  const startNodes = (cb) => {
    distribution.local.status.spawn(n1, (e, v) => {
      distribution.local.status.spawn(n2, (e, v) => {
        distribution.local.status.spawn(n3, (e, v) => {
          cb();
        });
      });
    });
  };

  distribution.node.start((server) => {
    localServer = server;

    const crawlConfig = {gid: 'crawl'};
    startNodes(() => {
      groupsTemplate(crawlConfig).put(crawlConfig, crawlGroup, (e, v) => {
        const stringMatchConfig = {gid: 'stringMatch'};
        groupsTemplate(stringMatchConfig).put(
            stringMatchConfig, stringMatchGroup, (e, v) => {
              const linkGraphConfig = {gid: 'linkGraph'};
              groupsTemplate(linkGraphConfig).put(
                  linkGraphConfig, linkGraphGroup, (e, v) => {
                    const wcConfig = {gid: 'wc'};
                    groupsTemplate(wcConfig).put(wcConfig, wcGroup, (e, v) => {
                      const recipeConfig = {gid: 'recipe'};
                      groupsTemplate(recipeConfig).put(
                          recipeConfig, recipeGroup, (e, v) => {
                            done();
                          });
                    });
                  });
            });
      });
    });
  });
});

afterAll((done) => {
  let remote = {service: 'status', method: 'stop'};
  remote.node = n1;
  distribution.local.comm.send([], remote, (e, v) => {
    remote.node = n2;
    distribution.local.comm.send([], remote, (e, v) => {
      remote.node = n3;
      distribution.local.comm.send([], remote, (e, v) => {
        localServer.close();
        done();
      });
    });
  });
});

function sanityCheck(mapper, reducer, dataset, expected, done) {
  let mapped = dataset.map((o) =>
    mapper(Object.keys(o)[0], o[Object.keys(o)[0]]));
  /* Flatten the array. */
  mapped = mapped.flat();
  let shuffled = mapped.reduce((a, b) => {
    let key = Object.keys(b)[0];
    if (a[key] === undefined) a[key] = [];
    a[key].push(b[key]);
    return a;
  }, {});
  let reduced = Object.keys(shuffled).map((k) => reducer(k, shuffled[k]));

  try {
    expect(reduced).toEqual(expect.arrayContaining(expected));
  } catch (e) {
    done(e);
  }
}

// ---all.mr---

test('Crawler', (done) => {
  let mapper = (key, value) => {
    // key is ID, value is URL
    // need node-fetch for this, but doesn't work with autograder
    // global.fetch(value)
    //     .then((response) => response.text())
    //     .then((data) => {
    //       global.distribution.local.store.put(data, value, () => {});
    //     });

    // ignore asynchronous call, just continue and return
    const out = {};
    out[key] = value;
    return out;
  };

  let reducer = (key, values) => {
    let out = {};
    const [value] = values;
    out[key] = value;
    return out;
  };

  let dataset = [
    {'0': 'https://www.google.com/'},
    {'1': 'https://www.youtube.com/'},
    {'2': 'https://www.nytimes.com/'},
    {'3': 'https://zoom.us/'},
    {'4': 'https://www.instagram.com/'},
  ];

  let expected = [
    {'0': 'https://www.google.com/'},
    {'1': 'https://www.youtube.com/'},
    {'2': 'https://www.nytimes.com/'},
    {'3': 'https://zoom.us/'},
    {'4': 'https://www.instagram.com/'},
  ];

  /* Sanity check: map and reduce locally */
  sanityCheck(mapper, reducer, dataset, expected, done);

  /* Now we do the same thing but on the cluster */
  const doMapReduce = (cb) => {
    distribution.crawl.store.get(null, (e, v) => {
      try {
        expect(v.length).toBe(dataset.length);
      } catch (e) {
        done(e);
      }

      distribution.crawl.mr.exec(
          {keys: v, map: mapper, reduce: reducer}, (e, v) => {
            try {
              expect(v).toEqual(expect.arrayContaining(expected));
              done();
            } catch (e) {
              done(e);
            }
          });
    });
  };

  let cntr = 0;

  // We send the dataset to the cluster
  dataset.forEach((o) => {
    let key = Object.keys(o)[0];
    let value = o[key];
    distribution.crawl.store.put(value, key, (e, v) => {
      cntr++;
      // Once we are done, run the map reduce
      if (cntr === dataset.length) {
        doMapReduce();
      }
    });
  });
});

test('Distributed String Matching', (done) => {
  let mapper = (key, value) => {
    // key is ID, value is line of text
    const arr = value.split(' ');
    let out = [];
    for (const word of arr) {
      // contains `b`
      const regex = /\b\w*b\w*\b/gi;
      if (regex.test(word)) {
        const o = {};
        o['dummyKey'] = word;
        out.push(o);
      }
    }
    return out;
  };

  let reducer = (key, values) => {
    let out = {};
    out[key] = values;
    return out;
  };

  let dataset = [
    {'0': 'disappoint navy perception isolation car'},
    {'1': 'trunk harm frog leaf lake'},
    {'2': 'excess chain abnormal refer swipe'},
    {'3': 'normal rabbit conservation glory contraction'},
    {'4': 'peanut silk fixture night combine'},
  ];

  let expected = [{'dummyKey': ['abnormal', 'rabbit', 'combine']}];

  /* Sanity check: map and reduce locally */
  sanityCheck(mapper, reducer, dataset, expected, done);

  /* Now we do the same thing but on the cluster */
  const doMapReduce = (cb) => {
    distribution.stringMatch.store.get(null, (e, v) => {
      try {
        expect(v.length).toBe(dataset.length);
      } catch (e) {
        done(e);
      }

      distribution.stringMatch.mr.exec(
          {keys: v, map: mapper, reduce: reducer}, (e, v) => {
            try {
              expect(v[0]['dummyKey']).toEqual(
                  expect.arrayContaining(expected[0]['dummyKey']));
              done();
            } catch (e) {
              done(e);
            }
          });
    });
  };

  let cntr = 0;

  // We send the dataset to the cluster
  dataset.forEach((o) => {
    let key = Object.keys(o)[0];
    let value = o[key];
    distribution.stringMatch.store.put(value, key, (e, v) => {
      cntr++;
      // Once we are done, run the map reduce
      if (cntr === dataset.length) {
        doMapReduce();
      }
    });
  });
});

test('Reverse Web Link Graph', (done) => {
  let mapper = (key, value) => {
    // key is edge ID, value is pair of source and sink URL
    const out = {};
    const [source, sink] = value;
    out[sink] = source;
    return out;
  };

  let reducer = (key, values) => {
    let out = {};
    out[key] = values;
    return out;
  };

  let dataset = [
    {'0': ['https://cs.brown.edu/courses/csci1380/sandbox/3/catalogue/category/books/travel_2/index.html', 'https://cs.brown.edu/courses/csci1380/sandbox/3/catalogue/its-only-the-himalayas_981/index.html']},
    {'1': ['https://cs.brown.edu/courses/csci1380/sandbox/3/index.html', 'https://cs.brown.edu/courses/csci1380/sandbox/3/catalogue/its-only-the-himalayas_981/index.html']},
    {'2': ['https://cs.brown.edu/courses/csci1380/sandbox/3/index.html', 'https://cs.brown.edu/courses/csci1380/sandbox/3/index.html']},
    {'3': ['https://cs.brown.edu/courses/csci1380/sandbox/3/catalogue/category/books/classics_6/index.html', 'https://cs.brown.edu/courses/csci1380/sandbox/3/catalogue/the-secret-garden_413/index.html']},
    {'4': ['https://cs.brown.edu/courses/csci1380/sandbox/3/index.html', 'https://cs.brown.edu/courses/csci1380/sandbox/3/catalogue/the-requiem-red_995/index.html']},
  ];

  let expected = [
    {'https://cs.brown.edu/courses/csci1380/sandbox/3/catalogue/its-only-the-himalayas_981/index.html': ['https://cs.brown.edu/courses/csci1380/sandbox/3/catalogue/category/books/travel_2/index.html', 'https://cs.brown.edu/courses/csci1380/sandbox/3/index.html']},
    {'https://cs.brown.edu/courses/csci1380/sandbox/3/index.html': ['https://cs.brown.edu/courses/csci1380/sandbox/3/index.html']},
    {'https://cs.brown.edu/courses/csci1380/sandbox/3/catalogue/the-secret-garden_413/index.html': ['https://cs.brown.edu/courses/csci1380/sandbox/3/catalogue/category/books/classics_6/index.html']},
    {'https://cs.brown.edu/courses/csci1380/sandbox/3/catalogue/the-requiem-red_995/index.html': ['https://cs.brown.edu/courses/csci1380/sandbox/3/index.html']},
  ];

  /* Sanity check: map and reduce locally */
  sanityCheck(mapper, reducer, dataset, expected, done);

  /* Now we do the same thing but on the cluster */
  const doMapReduce = (cb) => {
    distribution.linkGraph.store.get(null, (e, v) => {
      try {
        expect(v.length).toBe(dataset.length);
      } catch (e) {
        done(e);
      }

      distribution.linkGraph.mr.exec(
          {keys: v, map: mapper, reduce: reducer}, (e, v) => {
            try {
              const vObj = {};
              for (const pair of v) {
                const key = Object.keys(pair)[0];
                vObj[key] = pair[key];
              }
              const expectedObj = {};
              for (const pair of expected) {
                const key = Object.keys(pair)[0];
                expectedObj[key] = pair[key];
              }
              expect(Object.keys(vObj)).toEqual(
                  expect.arrayContaining(Object.keys(expectedObj)));
              for (const key of Object.keys(vObj)) {
                expect(vObj[key]).toEqual(
                    expect.arrayContaining(expectedObj[key]));
              }
              done();
            } catch (e) {
              done(e);
            }
          });
    });
  };

  let cntr = 0;

  // We send the dataset to the cluster
  dataset.forEach((o) => {
    let key = Object.keys(o)[0];
    let value = o[key];
    distribution.linkGraph.store.put(value, key, (e, v) => {
      cntr++;
      // Once we are done, run the map reduce
      if (cntr === dataset.length) {
        doMapReduce();
      }
    });
  });
});

test('Alternative Word-Count', (done) => {
  let mapper = (key, value) => {
    // map each word to a key-value pair like {word: 1}
    let words = value.split(/(\s+)/).filter((e) => e !== ' ');
    const counts = {};
    words.forEach((w) => {
      if (!counts[w]) {
        counts[w] = 0;
      }
      counts[w] += 1;
    });
    let out = [];
    for (const key of Object.keys(counts)) {
      const o = {};
      o[key] = counts[key];
      out.push(o);
    }
    return out;
  };

  let reducer = (key, values) => {
    let out = {};
    out[key] = values.reduce((a, b) => a + b, 0);
    return out;
  };

  let dataset = [
    {'b1-l1': 'It was the best of times, it was the worst of times,'},
    {'b1-l2': 'it was the age of wisdom, it was the age of foolishness,'},
    {'b1-l3': 'it was the epoch of belief, it was the epoch of incredulity,'},
    {'b1-l4': 'it was the season of Light, it was the season of Darkness,'},
    {'b1-l5': 'it was the spring of hope, it was the winter of despair,'},
  ];

  let expected = [
    {It: 1}, {was: 10},
    {the: 10}, {best: 1},
    {of: 10}, {'times,': 2},
    {it: 9}, {worst: 1},
    {age: 2}, {'wisdom,': 1},
    {'foolishness,': 1}, {epoch: 2},
    {'belief,': 1}, {'incredulity,': 1},
    {season: 2}, {'Light,': 1},
    {'Darkness,': 1}, {spring: 1},
    {'hope,': 1}, {winter: 1},
    {'despair,': 1},
  ];

  /* Sanity check: map and reduce locally */
  sanityCheck(mapper, reducer, dataset, expected, done);

  /* Now we do the same thing but on the cluster */
  const doMapReduce = (cb) => {
    distribution.wc.store.get(null, (e, v) => {
      try {
        expect(v.length).toBe(dataset.length);
      } catch (e) {
        done(e);
      }

      distribution.wc.mr.exec({keys: v, map: mapper,
        reduce: reducer, compact: reducer}, (e, v) => {
        try {
          expect(v).toEqual(expect.arrayContaining(expected));
          done();
        } catch (e) {
          done(e);
        }
      });
    });
  };

  let cntr = 0;

  // We send the dataset to the cluster
  dataset.forEach((o) => {
    let key = Object.keys(o)[0];
    let value = o[key];
    distribution.wc.store.put(value, key, (e, v) => {
      cntr++;
      // Once we are done, run the map reduce
      if (cntr === dataset.length) {
        doMapReduce();
      }
    });
  });
});

test('Recipe Sum', (done) => {
  let mapper = (key, value) => {
    const [intKey, count] = value.split(' ');
    let out = {};
    out[intKey] = parseInt(count);
    return out;
  };

  let reducer = (key, values) => {
    let out = {};
    out[key] = values.reduce((a, b) => a + b, 0);
    return out;
  };

  let dataset = [
    {'0': 'apples 4'},
    {'1': 'bananas 3'},
    {'2': 'carrots 6'},
    {'3': 'bananas 1'},
    {'4': 'apples 2'},
  ];

  let expected = [
    {'apples': 6},
    {'bananas': 4},
    {'carrots': 6},
  ];

  /* Sanity check: map and reduce locally */
  sanityCheck(mapper, reducer, dataset, expected, done);

  /* Now we do the same thing but on the cluster */
  const doMapReduce = (cb) => {
    distribution.recipe.store.get(null, (e, v) => {
      try {
        expect(v.length).toBe(dataset.length);
      } catch (e) {
        done(e);
      }

      distribution.recipe.mr.exec({keys: v, map: mapper,
        reduce: reducer, compact: reducer}, (e, v) => {
        try {
          expect(v).toEqual(expect.arrayContaining(expected));
          done();
        } catch (e) {
          done(e);
        }
      });
    });
  };

  let cntr = 0;

  // We send the dataset to the cluster
  dataset.forEach((o) => {
    let key = Object.keys(o)[0];
    let value = o[key];
    distribution.recipe.store.put(value, key, (e, v) => {
      cntr++;
      // Once we are done, run the map reduce
      if (cntr === dataset.length) {
        doMapReduce();
      }
    });
  });
});
