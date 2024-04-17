const fs = require('fs');
const readline = require('readline');

// spin up 3 nodes on localhost 

// to stop the nodes, if shutdown did not run properly to an exception
// sudo lsof -i :7110-7112 | awk 'NR>1 {print $2}' | xargs -r sudo kill -9

// to delete the entirety of store
// sudo rm -rf ../store/*

global.nodeConfig = {ip: '127.0.0.1', port: 7070};
const distribution = require('../distribution');
const id = distribution.util.id;

const groupsTemplate = require('../distribution/all/groups');
const ncdcGroup = {};
const dlibGroup = {};

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

const n1 = {ip: '127.0.0.1', port: 7110};
const n2 = {ip: '127.0.0.1', port: 7111};
const n3 = {ip: '127.0.0.1', port: 7112};


const do_initialize = (done) => {
    /* Stop the nodes if they are running */
  
    ncdcGroup[id.getSID(n1)] = n1;
    ncdcGroup[id.getSID(n2)] = n2;
    ncdcGroup[id.getSID(n3)] = n3;
  
    dlibGroup[id.getSID(n1)] = n1;
    dlibGroup[id.getSID(n2)] = n2;
    dlibGroup[id.getSID(n3)] = n3;
  
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
  
      const ncdcConfig = {gid: 'ncdc'};
      startNodes(() => {
        groupsTemplate(ncdcConfig).put(ncdcConfig, ncdcGroup, (e, v) => {
          const dlibConfig = {gid: 'dlib'};
          groupsTemplate(dlibConfig).put(dlibConfig, dlibGroup, (e, v) => {
            done();
          });
        });
      });
    });
};

const teardown = (done) => {
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
};
  


do_initialize(() => {

    const links_path = 'less-links.txt';

    const data = fs.readFileSync(links_path, 'utf8');
    
    // Split the file content by new lines
    const lines = data.split(/\r?\n/);

    cntr = 0;
    
    let keys = [];

    // Process each line and send to node
    lines.forEach((line, index) => {
        console.log(`Line ${index + 1}: ${line}`);

        // key = line, value = line. Line is just the url. 

        // Note, replace / with _, since / is not allowed in keys
        // This is a hack to make it easier during query to figure out the link 
        // In an ideal world, we'd map link --> uid --> content
        let key = line.replace(/\//g, '_');
        key = key.replace(/\./g, '?');

        // therefore, the following key: https:__atlascsbrownedu_data_gutenberg_0_4_4?txt
        // can be mapped back to the real link by just replacing _ with /, and ? with .

        distribution.ncdc.store.put(line, key, (e, v) => {
            keys.push(key);

            cntr++;
            // Once we are done, run the map reduce
            if (cntr === lines.length) {
              console.log("Done putting link data into store");

                // Run map-reduce to extract the txt content from each link. 

                const mapFn = async (key, value) => {
                    const url = value;
                    let out = {};

                    try {
                        console.log("Fetching url: ", url);
                        const response = await global.axios.get(url);
                        console.log(response.data);
                        out[key] = response.data;
                    } catch (error) {
                        console.error('Error fetching the file:', error);
                        out[key] = null;
                    }

                   return out;
                };

                // dummy reduce function that does nothing. 
                const reduceFn = (key, values) => {
                    let out = {};
                    out[key] = values;
                    return out;
                };

                distribution.ncdc.mr.exec({keys: keys, map: mapFn, reduce: reduceFn}, (e, v) => {
                    console.log("Done with map-reduce");
                    // console.log("Results: ", v);

                    let numBooksFetched = v.length; 

                    console.log("Number of books fetched: ", numBooksFetched);



                    let count = 0; 
                    for (let nodeResults of v) {
                        // console.log("Node Results: ", nodeResults);
                        for (let key in nodeResults) {
                            let txtBookContent = nodeResults[key][0];

                            // send the txt content to the group. 

                            distribution.ncdc.store.put(txtBookContent, key, (e, v) => {
                              count++;
                              if (e) {
                                console.log("Error storing txt content: ", e);
                              } else {
                                if (count == numBooksFetched) {
                                  // finished storing the txt content for all books on the nodes. 
                                  console.log("Done storing txt content for all books")
                                  // now we can proceed to indexing. 


                                  const mapFnForIndexer = (key, value) => {
                                    // key: "https:__atlas?cs?brown?edu_data_gutenberg_0_7_old_7?txt"
                                    // value: text content for a book. 
                                    
                                    value = value.toLowerCase();
                                    value = value.replace(/[^a-zA-Z0-9]/g, ' ');
                                    value = value.replace(/\s{2,}/g, ' ');
                                    let words = value.split(/(\s+)/).filter((e) => e !== ' ' && e !== '');
                                    
                                    // console.log("Words: ", words);


                                    let NGRAMSIZE = 4; 
                                    let out = []; 
              
                                    for (let ngram = 1; ngram <= NGRAMSIZE; ngram++) {
                                      ngram = NGRAMSIZE;
                                      for (let i = 0; i < words.length - ngram; i++) {
                                        let ngramKey = words.slice(i, i + ngram);
                                        let o = {};

                                        let strNGram = ngramKey.join(' ');
                                        // o[key] = ngramKey.join(' ');
                                        out[strNGram] = key; 

                                        out.push(o);
                                      }
                                    }
                                    return out; 
                                  }


                                  distribution.ncdc.mr.exec({keys: keys, map: mapFnForIndexer, reduce: reduceFn}, (e, v) => {
                      
                                    console.log("Done with indexing");
              
                                    console.log("Indexing Results: ", v);
                                    // v is inverted index: ngrams --> [list of URLs]
                                    
                                    // store the inverted index in the store. 

                                    // in query, it's distributed grep. 

              
                                    teardown(() => {
                                      console.log('done');
                                    });     
                                  });     

                               
                                } 
                              }
                            });
                            
                        }
                    }


                    

                       
                });
            }
        });
    });
});
