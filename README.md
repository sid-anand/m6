# M6: Cloud Deployment
> Full names: `Allison Hsieh`, `Brandon Yan`, `Mithi Jethwa`, `Sidharth Anand`, `Sreehari Rammohan`

> Emails: `allison_hsieh@brown.edu`, `brandon_yan@brown.edu`, `mithi_jethwa@brown.edu`, `sidharth_anand@brown.edu`, `sreehari_rammohan@brown.edu`

## Summary
See the paper for more information on the design and implementation!

## Running Locally
1. Clone the repo and navigate into the `m6/test` subdirectory.
2. Run `npm install` to update packages.
3. Run `export NODE_TLS_REJECT_UNAUTHORIZED=0` to bypass SSL certificate validation (needed for crawling).
4. Run `lsof -i :7110-7112 | awk 'NR>1 {print $2}' | xargs -r kill -9` to kill any zombie nodes.
5. Run `rm -rf ../store/*` to clear the persistent store.
6. Run `node urls.js` to run the distributed URL crawling phase, which collects URLs in `links.txt`.
7. Run `rm -rf ../store/*` to clear the persistent store again.
8. Run `node search.js` to start up the search engine, which will first download and index pages, and then allow you to provide a query.

## Running on AWS
On each EC2 instance:
1. Run `sudo apt update`.
3. Run `sudo apt install nodejs git vim`.
4. Run `sudo apt install npm`.
5. Clone the repo and navigate into the `m6` subdirectory.
6. Run `npm install`.
7. Run `export NODE_TLS_REJECT_UNAUTHORIZED=0` to bypass SSL certificate validation (needed for crawling).
8. Run `rm -rf ../store/*` to clear the persistent store.
9. Run `chmod +x distribution.js`.
10. Run `./distribution.js --ip '0.0.0.0' --port 8080` to start up the node.

Locally:
1. Clone the repo and navigate into the `m6/test` subdirectory.
2. Run `npm install` to update packages.
3. Run `export NODE_TLS_REJECT_UNAUTHORIZED=0` to bypass SSL certificate validation (needed for crawling).
4. Run `lsof -i :7110-7112 | awk 'NR>1 {print $2}' | xargs -r kill -9` to kill any zombie nodes.
5. Run `rm -rf ../store/*` to clear the persistent store.
6. **Run `ec2.search.js`**, but make sure to change the placeholder IP addresses near the top of the file to the real EC2 IPs.