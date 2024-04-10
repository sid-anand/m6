# M5: Distributed Execution Engine
> Full name: `Sidharth Anand`
> Email:  `sidharth_anand@brown.edu`
> Username:  `sanand13`

## Summary
> Summarize your implementation, including key challenges you encountered

My implementation comprises `2` new software components, totaling `191` added lines of code over the previous implementation. One challenge was figuring out how to have the coordinator initialize and end each of the phases (map, shuffle, reduce), but I realized that our distributed `comm.send` already does most of the work. Another challenge was some concurrency issues with writing to the file system from multiple nodes, and I fixed that by making all the writes synchronous, rather than asynchronous. Finally, I was running into a issue with different intermediate keys only differing in capitalization, which made them get aggregated into the same file, and I fixed this by moving to a single-file approach where the whole map phase occurs in-memory and only gets written out to a file at the end.

## Correctness & Performance Characterization
> Describe how you characterized the correctness and performance of your implementation

*Correctness*: I wrote 5 MapReduce workflows, where 3 were required. The remaining 2 workflows were a word-counter (but using an alternative approach to the provided test), and a simple recipe ingredient aggregator, respectively.

*Performance*: In aggregate, all 5 workflows take `0.956` seconds to run back-to-back.

## Key Feature
> Which extra features did you implement and how?

I implemented the `Compaction functions` feature by allowing the MapReduce user to provide an optional `compact` function. This function is used during the shuffling phase and is simply applied to the locally-stored mapped results before sending them off to the relevant reducer node. In many cases, users can just provide their `reduce` function again as a `compact` function, and this will lead to significant improvements.

I tested this compaction feature in my 2 extra workflows, and both of those tests pass.

## Time to Complete
> Roughly, how many hours did this milestone take you to complete?

Hours: `14`

