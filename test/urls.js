const fs = require('fs');
const axios = require('axios');

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

const gatherLinks = () => {

  const links_path = 'root-link-list.txt'; //contains the root links to start crawling from

  const data = fs.readFileSync(links_path, 'utf8');
  
  // Split the file content by new lines
  const lines = data.split(/\r?\n/);

  cntr = 0;
  
  let keys = [];

  let mapper = async (key, value) => {
    let getURLs = async (url) => {
      if (url.charAt(url.length - 1) != '/') {
        //no more urls within page to extract if path ends in a file name
        return;
      } else {
        try {
          //get content of file
          const response = await global.axios.get(url);
          //get links using regex
          const linkRegex = /<a\s+(?:[^>]*?\s+)?href=(["'])(.*?)\1/gi;
          const links = [];
          let match;
          //compile all of the links
          while ((match = linkRegex.exec(response.data)) !== null) {
            const link = match[2];
            //if link has a leading slash, it is probably a filepath based off of the origin
            if(link.charAt(0) == '/'){
              const baseURL = new URL(url).origin;
              links.push(baseURL + link);
            //otherwise, just append link to original url
            } else {
              links.push(url + link);
            }
          }
          return links;
        } catch (error) {
          //console.error('Error fetching the file:', error);
          return error;
        }
      }
    }
  
    //urls that have already been processed
    let seen = [];
    //queue for urls that will be processed
    let toCrawl = [];
    //array of urls that will be returned (aka they are the final text pages with no links)
    let finalUrls = [];
    seen.push('https://atlas.cs.brown.edu/data/gutenberg/'); //just so the crawling does not keep seeking to the parent with archives
    toCrawl.push(value); //pushes the current url onto the queue
    //while there are still urls to process
    while(toCrawl.length > 0){
      //get the first url and pop it from the queue
      const currentUrl = toCrawl[0];
      toCrawl.shift();
      //if this url has not been seen already
      if(!seen.includes(currentUrl)){
        //if this url is not a duplicate sorting filter url
        if(!currentUrl.includes('?')){
          //if this url has no more sub-urls (there is no slash at the end)
          if(currentUrl.charAt(currentUrl.length - 1) != '/'){
            //add key-value pair where key is the original root url with special characters replaced, value is the final url itself
            let out = {};
            out[key] = currentUrl;
            finalUrls.push(out);
          } else {
            //push all of the sub urls onto the queue for processing later
            const fetchedUrls = await getURLs(currentUrl);
            toCrawl.push(...fetchedUrls);
          }
        }
        //even if url is a duplicate sorter url, add to the seen queue so we don't have to process them again
        seen.push(currentUrl);
      }
    }
    return finalUrls;
  }


  let reducer = (key, values) => {
    //dummy reducer that just outputs the original key value pair
    let out = {};
    out[key] = values;
    return out;
  }

  //for every root url index
  lines.forEach((line, index) => {
    //replace special characters in a similar fashion as content downloading
    let key = line.replace(/\//g, '_');
    key = key.replace(/\./g, '?');

    //add this root url to the store
    distribution.ncdc.store.put(line, key, (e, v) => {
      keys.push(key);
      cntr++;
      //if all root urls processed
      if(cntr === lines.length){
        //start mapreduce pipeline
        distribution.ncdc.mr.exec({keys: keys, map: mapper, reduce: reducer}, (e, v) => {
          console.log("Done with map-reduce crawl");
          console.log("Results crawl: ", v);
          //aggregate crawled urls into links.txt file
          for(var k = 0; k < lines.length; k++){
            const currentObj = v[k];
            const resultingKeys = Object.keys(currentObj);
            for(var i = 0; i < resultingKeys.length; i++){
              const currentKey = resultingKeys[i];
              const currentUrls = currentObj[currentKey];
              for(var j = 0; j < currentUrls.length; j++){
                fs.appendFile('links.txt', currentUrls[j] + '\n', (err) => {
                    console.error(err);
                });
              }
            }
          }
          teardown(() => {
            console.log("done tearing down");
          });          
        });
      }
    });
  });
}

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


do_initialize(()=> {
    gatherLinks();
});