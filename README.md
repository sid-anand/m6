

`crawl.js`

Right now, ingests the txt file `less-links.txt`, distributes these links to the nodes, and then runs the crawl phase. 

Crawl phase is a simple axios get request on the link, which then returns the text content of the book.



TODO: 

- Crawl
    - Allison, 4/14/24, Right now, a single worker is doing the crawl to actually get the unique links, this is not ideal. Can you distribute the crawl phase to the nodes as well? This would involve (writing new MSR functions) starting the crawl phase from 3 seed nodes (or more) and then simply extracting & downloading links from there. The gutenberg site actually doesn't have overlap if the seeds are different. https://atlas.cs.brown.edu/data/gutenberg/{1-9}. Reduce should coalesce the results into 1 txt file so that this method essentially just produces `links.txt` (which we produced using the single worker technique). Run the existing crawl.js file to see the state of the links on each node, ideally your new method should leave the nodes in the state that crawl.js expects (after distributing the links to each node). Then, your functions can run, and seamlessly integrate with the existing code to download the text content of the books.

- Index
- Query