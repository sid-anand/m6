const fs = require('fs');

// spin up 3 nodes on localhost

// to stop the nodes, if shutdown did not run properly to an exception
// sudo lsof -i :7110-7112 | awk 'NR>1 {print $2}' | xargs -r sudo kill -9

// to delete the entirety of store
// sudo rm -rf ../store/*

global.nodeConfig = {ip: '127.0.0.1', port: 8080};
const distribution = require('../distribution');
const id = distribution.util.id;

const groupsTemplate = require('../distribution/all/groups');
const serialization = require('../distribution/util/serialization');
const nodeGroup = {};

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

const n1 = {ip: '54.147.156.183', port: 8080};
const n2 = {ip: '54.221.21.21', port: 8080};
const n3 = {ip: '18.207.118.144', port: 8080};


const doInitialize = (done) => {
  /* Stop the nodes if they are running */

  nodeGroup[id.getSID(n1)] = n1;
  nodeGroup[id.getSID(n2)] = n2;
  nodeGroup[id.getSID(n3)] = n3;

  const startNodes = (cb) => {
    cb();
    // distribution.local.status.spawn(n1, (e, v) => {
    //   distribution.local.status.spawn(n2, (e, v) => {
    //     distribution.local.status.spawn(n3, (e, v) => {
    //       cb();
    //     });
    //   });
    // });
  };

  distribution.node.start((server) => {
    localServer = server;

    const groupConfig = {gid: 'group'};
    startNodes(() => {
      groupsTemplate(groupConfig).put(groupConfig, nodeGroup, (e, v) => {
        done();
      });
    });
  });
};

const teardown = (done) => {
  done();
  // let remote = {service: 'status', method: 'stop'};
  // remote.node = n1;
  // distribution.local.comm.send([], remote, (e, v) => {
  //   remote.node = n2;
  //   distribution.local.comm.send([], remote, (e, v) => {
  //     remote.node = n3;
  //     distribution.local.comm.send([], remote, (e, v) => {
  //       localServer.close();
  //       done();
  //     });
  //   });
  // });
};

const mapDownload = async (key, value) => {
  // key: "https:__atlas?cs?brown?edu_data_gutenberg_0_7_old_7?txt"
  // value: full URL to download from

  const url = value;
  let out = {};

  try {
    const response = await global.axios.get(url);
    out[key] = response.data;

    if (global.distribution.util.serialize(out[key]).includes("Unexpected end of JSON input")) {
      out[key] = null;
      console.log('Error serializing the file:', key);
    }

  } catch (error) {
    console.error('Error fetching the file:', error);
    out[key] = null;
  }

  return out;
};

// dummy reduce function that does nothing.
const reduceDownload = (key, values) => {
  let out = {};
  out[key] = values;
  return out;
};

// the only change needed in reduceIndex is to prevent duplicate values.
// ngram --> [list of books]
// we want to prevent duplicate books in the list.
const reduceIndex = (key, values) => {
  let out = {};

  // values is an array of strings
  values = values.filter((v, i, a) => a.indexOf(v) === i);

  out[key] = values;
  return out;
};

const mapIndex = (key, value) => {
  // key: "https:__atlas?cs?brown?edu_data_gutenberg_0_7_old_7?txt"
  // value: text content for a book.

  value = value.toLowerCase();
  value = value.replace(/[^a-zA-Z0-9]/g, ' ');
  value = value.replace(/\s{2,}/g, ' ');
  let words = value.split(/(\s+)/).filter((e) => e !== ' ' && e !== '');

  // TEMPORARY - ONLY TAKE THE FIRST 100 WORDS
  words = words.slice(0, 100);

  let MAX_NGRAM = 2;
  let out = [];
  for (let ngram = 1; ngram <= MAX_NGRAM; ngram++) {
    for (let i = 0; i < words.length - ngram; i++) {
      let ngramKey = words.slice(i, i + ngram);
      let o = {};
      let strNGram = ngramKey.join(' ');
      o[strNGram] = key;
      out.push(o);
    }
  }
  return out;
};

const indexingProcess = (keys) => {
  // Run MR to index each page's contents
  distribution.group.mr.exec({keys: keys, map: mapIndex, reduce: reduceDownload}, (e, v) => {
    console.log('Indexed all books');
    console.log('Indexing Results: ', v);

    // shuffle the ngrams to the correct node.

    for (let ngram of v) {
      const ngramKey = Object.keys(ngram)[0];
      const ngramValue = ngram[ngramKey];

      // Store the ngram in the group store, with the ngram as the key.
      // The value is the list of URLs that contain the ngram.
      distribution.group.store.put(ngramValue, ngramKey, (e, v) => {
        console.log('Stored ngram:', ngramKey);
      });
    }

    // v is inverted index: ngrams --> [list of URLs]
    // store the inverted index in the store.
    // in query, it's distributed grep.
    teardown(() => {
      console.log('done');
    });
  });
};

doInitialize(() => {
  // Read links from less-links.txt
  // Store the dataset onto the cluster
  // Run mr.exec with all the keys to do the distributed downloading
  // Store the txt content of each book onto the cluster

  const linksPath = 'less-links.txt';
  const data = fs.readFileSync(linksPath, 'utf8');

  // Split the file content by newlines, accounting for Windows carriage returns
  const lines = data.split(/\r?\n/);

  let loadCtr = 0;
  // Put each URL into the store (change this when we implement distributed crawling)
  lines.forEach((line) => {
    // Note, replace / with _, since / is not allowed in keys
    // This is a hack to make it easier during query to figure out the link
    // In an ideal world, we'd map link --> uid --> content
    // therefore, the following key:
    // https:__atlascsbrownedu_data_gutenberg_0_4_4?txt
    // can be mapped back to the real link by just replacing _ with /, and ? with .
    let key = line.replace(/\//g, '_');
    key = key.replace(/\./g, '?');

    distribution.group.store.put(line, key, (e, v) => {
      console.log('value:', v);
      loadCtr++;
      if (loadCtr === lines.length) {
        console.log('Loaded urls into store');

        // Run MR to download the page content for each URL
        distribution.group.store.get(null, (e, keys) => {
          distribution.group.mr.exec({keys: keys, map: mapDownload, reduce: reduceDownload}, (e, v) => {
            console.log('Downloaded all books');
            let downloadCtr = 0;
            console.log("URL Results: ", Object.keys(v).length);

            const numResults = Object.keys(v).length;

            for (let urlResults of v) {

              const urlKey = Object.keys(urlResults)[0];
              const pageContent = urlResults[urlKey][0];

              console.log("URL Key: ", urlKey);


              // Put all the page contents into the store
              distribution.group.store.put(pageContent, urlKey, (e, v) => {
                downloadCtr++;

                console.log("download ctr: ", downloadCtr, "lines length: ", numResults);

                if (downloadCtr === numResults) {
                  console.log('Stored all books');
                  console.log("Starting the indexing process")
                  indexingProcess(keys);
                }
              });

            }
          });
        });
      }
    });
  });
});

