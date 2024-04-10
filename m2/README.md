# M2: Actors and Remote Procedure Calls (RPC)
> Full name: `Sidharth Anand`
> Email:  `sidharth_anand@brown.edu`
> Username:  `sanand13`

## Summary
> Summarize your implementation, including key challenges you encountered

My implementation comprises `3` software components (`local/node.js`, `local/local.js`, `util/wire.js`), totaling `314` lines of code. One challenge was simply understanding the Node.js `http` module's API in order to send HTTP requests through `comm.send` and receive them through `http.createServer`, but reading the documentation and examples helped with that. A second challenge was in implementing RPCs because I didn't understand where I could insert the node info and method ID into the RPC stub, but I solved this by serializing, replacing, and then deserializing back right in `createRPC`. A final challenge was dealing with error checking and variable numbers of arguments because, for example, the RPC stub always needs to take a final callback argument, but I solved this using a similar approach to `toAsync`.

## Correctness & Performance Characterization
> Describe how you characterized the correctness and performance of your implementation

*Correctness*: I wrote `5` tests; these tests take `0.303 s` to execute. 

*Performance*: Evaluating RPC performance using [high-resolution timers](https://nodejs.org/api/perf_hooks.html) by sending 1000 service requests in a tight loop results in an average throughput of `645` requests per second and an average latency of `2.1` ms.

## Key Feature
> How would you explain your implementation of `createRPC` to your grandparents (assuming your grandparents are not computer scientists...), i.e., with the minimum jargon possible?

When called on node `A`, `createRPC` returns a function that can be sent to node `B`. When node `B` calls this function with some arguments, those arguments will be sent over the wire back to node `A`, where the original function call will complete and the results will be sent back to node `B`. In other words, node `A` grants node `B` the ability to place a remote call to a particular function and receive the results.

My implementation of `createRPC` achieves this by first creating a unique ID for an `rpc` service method that invokes the function. Then, it creates the RPC stub and replaces the node info (IP and port) and method ID by serializing, replacing, and then deserializing.

## Time to Complete
> Roughly, how many hours did this milestone take you to complete?

Hours: `15`
