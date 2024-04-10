# M3: Node Groups & Gossip Protocols
> Full name: `Sidharth Anand`
> Email:  `sidharth_anand@brown.edu`
> Username:  `sanand13`

## Summary
> Summarize your implementation, including key challenges you encountered

My implementation comprises `8` new software components, totaling `331` added lines of code over the previous implementation. One challenge was correctly implementing the `local.status.spawn` and `local.status.stop` methods because they use the Node.js API for spawning and exit child processes, and small errors like accidentally calling the callback from `spawn` could result in timeout errors, but careful debugging addressed this. Another challenge was getting the distributed `groups` service to properly instantiate a new group and its services, as a lot of tests ran distributed services on the new group immediately afterward, so I resolved this by ensuring to always instantiate the group on the local node. A final challenge was that `gossip.recv` needs to call `gossip.send` in order to further propagate the gossip (after deduplication), but it requires a `gid` to do so, and I solved this by passing the `gid` along with the gossip message.

## Correctness & Performance Characterization
> Describe how you characterized the correctness and performance of your implementation

*Correctness*: I wrote `5` tests; these tests take `0.643s` to execute. 

*Performance*: Launching a 100 nodes takes about `0.5` seconds, and propagating a message to the entire network via gossip.send at that scale takes about `1` seconds — assuming the message is just a simple `status.get` of the `nid` attribute, and each node picks 3 other nodes randomly to gossip to.

## Key Feature
> What is the point of having a gossip protocol? Why doesn't a node just send the message to _all_ other nodes in its group?

Gossip protocols are more fault-tolerant than having a single node communicate with all other nodes in the network because messages flow along multiple separate routes. Also, they are more scalable and performant because each node gossips with a small (or even fixed) number of other nodes, depending on the subset function.

## Time to Complete
> Roughly, how many hours did this milestone take you to complete?

Hours: `22`

