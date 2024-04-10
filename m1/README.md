# M1: Serialization / Deserialization
> Full name: `Sidharth Anand`
> Email:  `sidharth_anand@brown.edu`
> Username:  `sanand13`

## Summary
> Summarize your implementation, including key challenges you encountered

My implementation comprises `2` software components (`serialize` and `deserialize`), totaling `177` lines of code. One challenge was figuring out how to serialize/deserialize user-defined functions, but I realized that `eval` already does the hard work of unpacking a stringified function into its arguments and body, so I could use it out of the box. A second challenge was getting a map of references to persist through my recursive serialization process, and I realized that I could create an inner function `serializeRec` (and `deserializeRec`) that was scoped to have access to the map. A final challenge was in traversing all the native objects because I was initially getting a `Maximum call stack size exceeded` error (likely due to loops), but I fixed it using a `Set` to keep track of the previously-visited objects/functions.

## Correctness & Performance Characterization
> Describe how you characterized the correctness and performance of your implementation

*Correctness*: I wrote `6` tests; these tests take `0.268s` to execute. This includes object chains that require multiple jumps to detect a cycle, complex native functions/objects like `eval` and `ArrayBuffer.prototype`, and objects with multiple self-references that create cycles.

*Performance*: Evaluating serialization and deserialization on objects of varying sizes using [high-resolution timers](https://nodejs.org/api/perf_hooks.html) results in the following table:

|               | Serialization | Deserialization |
| ------------- | ------------- | --------------- |
| 100 elems     | `1ms`         | `1ms`           |
| 1000 elems    | `1ms`         | `1ms`           |
| 10000 elems   | `10ms`        | `16ms`          |
| 100 funcs     | `1ms`         | `1ms`           |
| 1000 funcs    | `1ms`         | `1ms`           |
| 10000 funcs   | `9ms`         | `16ms`          |
| 1000 cycles   | `1ms`         | `1ms`           |
| 10000 native  | `5ms`         | `8ms`           |

## Time to Complete
> Roughly, how many hours did this milestone take you to complete?

Hours: `12`

## Wild Guess
> This assignment made a few simplifying assumptions — for example, it does not attempt to support the entire language. How many lines of code do you think it would take to support other features? (If at all possible, try to justify your answer — even a rough justification about the order of magnitude and its correlation to missing features is enough.)

FLoC: `500`

The main primitive value types we're missing are BigInts and Symbols, and those should require minimal extra LoC to account for. The main extension would be supporting all built-in and user-defined classes such as `Map` and `Set` because currently we have special cases for `Date`, `Error`, and `Array`. This would probably require some more complex metaprogramming, which I'd estimate at a couple hundred LoC.
