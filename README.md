

`crawl.js`

Right now, ingests the txt file `less-links.txt`, distributes these links to the nodes, and then runs the crawl phase. 

Crawl phase is a simple axios get request on the link, which then returns the text content of the book.

To bypass SSL certificate validation
```
export NODE_TLS_REJECT_UNAUTHORIZED=0
```

TODO: 

- Crawl
    - Allison, 4/14/24, Right now, a single worker is doing the crawl to actually get the unique links, this is not ideal. Can you distribute the crawl phase to the nodes as well? This would involve (writing new MSR functions) starting the crawl phase from 3 seed nodes (or more) and then simply extracting & downloading links from there. The gutenberg site actually doesn't have overlap if the seeds are different. https://atlas.cs.brown.edu/data/gutenberg/{1-9}. Reduce should coalesce the results into 1 txt file so that this method essentially just produces `links.txt` (which we produced using the single worker technique). Run the existing crawl.js file to see the state of the links on each node, ideally your new method should leave the nodes in the state that crawl.js expects (after distributing the links to each node). Then, your functions can run, and seamlessly integrate with the existing code to download the text content of the books.

- Index
- Query


To run using EC2 instances:

Email: brandonyan5@gmail.com

Password: AWSACCOUNT6$

Connect to each EC2 instance using the connect button. Currently have fully set up 7 EC2 instances:
1. Public ip: '54.147.156.183'
2. Public ip: '54.221.21.21'
3. Public ip: '18.207.118.144' 
4. Public ip: '54.164.35.195'
5. Public ip: '54.198.96.208'
6. Public ip: '54.147.224.143'
7. Public ip: '44.223.1.5'
....

In each console for each instance, do the following:
1. cd into m6. git pull if necessary.
2. npm install if necessary
3. ``` export NODE_TLS_REJECT_UNAUTHORIZED=0```
4. ```./distribution.js --ip '0.0.0.0' --port 8080```
4. run ```chmod +x distribution.js``` if getting permission denied
5. Leave each tab open and running

Then run test/search.js on your local machine.


Brand new setup for a new EC2 instance:
1. Sudo apt update
2. sudo apt install nodejs git vim
3. Git clone the repo
4. ```cd m6```
5. ```sudo apt install npm```
6. ```npm install```
7. ```chmod +x distribution.js```
8. ```export NODE_TLS_REJECT_UNAUTHORIZED=0```
9. ```./distribution.js --ip '0.0.0.0' --port 8080```


After first-time setup, only need to do these 2 each time to start the server on each node:
1. ```export NODE_TLS_REJECT_UNAUTHORIZED=0```
2. ```./distribution.js --ip '0.0.0.0' --port 8080```

To run the search process again, run these 3 commands for complete teardown
```
sudo lsof -i :7110-7112 | awk 'NR>1 {print $2}' | xargs -r sudo kill -9
rm -rf ../store/*
export NODE_TLS_REJECT_UNAUTHORIZED=0
```
