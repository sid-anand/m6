# M0: Setup & Centralized Computing
> Full name: `Sidharth Anand`
> Email:  `<sidharth_anand@brown.edu>`
> Username:  `sanand13`

## Summary
> Summarize your implementation, including key challenges you encountered

My implementation comprises `8` software components, totaling `197` lines of code in the following languages: `52` lines of shell scripts and `145` of JavaScript code. One challenge was figuring out how to use a shell script to generate n-grams in combine.sh, and I discovered that the `awk` command allows you to essentially for-loop over the word list and store variables. A second challenge was in getting merge.js to generate the global index with properly ordered URL-count pairs, and I solved this by comparing counts to decide where to insert a new pair. A final challenge was that Sandbox 3 was initially infinite-looping, which I solved by ensuring that URLs were not crawled more than once.

## Correctness & Performance Characterization
> Describe how you characterized the correctness and performance of your implementation

*Correctness*: My implementation passes `9` out of the `9` tests (`100`%) already provided for M0. I developed another `5` tests, which focus on further unit-testing each component of the pipeline but with more complex inputs from Sandbox 2 rather than Sandbox 1. All these tests, combined take `0.81` seconds to complete. I also increased my correctness confidence by performing queries on the global index and clicking through the URLs to ensure that the search term actually appeared on the relevant page.

*Performance*: Evaluating the entire system using the `time` command on the three sandboxes reports the following times:

|           | Engine          | Query          |
| --------- | --------------- | -------------- |
| Sandbox 1 | `3.92` seconds  | `0.01` seconds |
| Sandbox 2 | `45.55` seconds | `0.29` seconds |
| Sandbox 3 | `39` minutes    | `0.12` seconds |

## Time to Complete
> Roughly, how many hours did this milestone take you to complete?

Hours: `14`

## Wild Guess
> How many lines of code do you think it will take to build the fully distributed, scalable version of your search engine? (If at all possible, try to justify your answer — even a rough justification about the order of magnitude is enough)

DLoC: `2000`

Although the core functionality of the centralized search engine has required a small amount of code (on the order of a few hundred lines), I think distributing it and scaling it out will require a lot more infrastructure, which justifies the increase in order of magnitude.
