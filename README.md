

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
Password: AWSAccount6$

Connect to each EC2 instance using the connect button:
Currently have fully set up 7 EC2 instances:
Public ip: '54.147.156.183'
Public ip: '54.221.21.21'
Public ip: '18.207.118.144' 
Public ip: '54.164.35.195'
Public ip: '54.198.96.208'
Public ip: '54.147.224.143'
Public ip: '44.223.1.5'
....

In each console for each instance, do the following:
1. cd into m6. git pull if necessary.
2. npm install if necessary
3. export NODE_TLS_REJECT_UNAUTHORIZED=0
4. ./distribution.js --ip '0.0.0.0' --port 8080
4. run chmod +x distribution.js if getting permission denied
5. Leave each tab open and running

Then run test/distributed.crawl.js on your local machine.


Brand new setup for a new EC2 instance:
Sudo apt update
sudo apt install nodejs git vim
Git clone the repo
Cd m6
sudo apt install npm
Npm install
Chmod +x distribution.js
export NODE_TLS_REJECT_UNAUTHORIZED=0
./distribution.js --ip '0.0.0.0' --port 8080


After first-time setup, only need to do these 2 each time to start the server on each node:
export NODE_TLS_REJECT_UNAUTHORIZED=0
./distribution.js --ip '0.0.0.0' --port 8080
