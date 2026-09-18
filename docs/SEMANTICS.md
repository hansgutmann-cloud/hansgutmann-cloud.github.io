# Executable semantics

## Expression language

```
program := ("let" name "=" expr ";")* "return" expr ";"
expr    := sum
sum     := product (("+" | "-") product)*
product := unary ("*" unary)*
unary   := "-" unary | number | name | "(" expr ")"
```

Whitespace and `//` comments are ignored. Names are case-sensitive and immutable. `input` is the sole predefined binding. Literal bit patterns must fit in 32 bits. Every operation is a signed i32 operation with two's-complement wrapping; addition and subtraction are truncated with `|0`, multiplication uses `Math.imul` in the reference interpreter. The emitted Wasm uses `i32.add`, `i32.sub`, and `i32.mul`.

Because this language is pure and uses modular arithmetic, its selected identities, constant folding, common-subexpression elimination and dead-code elimination preserve this semantics. The implementation does not extend that claim to JavaScript numbers or IEEE floating point.

SSA-like registers are unique definitions; this straight-line language has no CFG joins or phi nodes. Optimization may leave gaps in register names. The emitter maps surviving definitions to Wasm locals. The module imports nothing and exports one function, `compute`. Its byte size is measured; instruction-count reduction is not advertised as speedup.

## Permutations

A permutation is a length-three array of zero-based images. `compose(p,q)` is `q.map(i => p[i])`. The UI displays one-based images. Generators are a=[1,2,0] and b=[1,0,2]. The six elements are constructed by composition.

Every click right-multiplies the current element. Thus the sequence of button labels is a group product, not a claim that the leftmost operation acts first on triangle positions.

## Cache

Addresses are element indices, not byte addresses. A 16×16 matrix is physically row-major. The cache is initially empty, with eight direct-mapped lines. Given a line size B:

```
block = floor(address / B)
index = block % 8
tag = floor(block / 8)
```

A hit means the selected line already holds the same tag. Reads allocate on misses. There are no writes, dirty bits, associativity, prefetching or timing estimates. Blocked traversal uses 4×4 iteration tiles; this tile size is distinct from cache-line size.

## Scheduler

Arrival times and CPU bursts are integers. A FIFO ready queue implements round robin. A slice is `min(quantum, remaining)`. Arrivals up to and including the slice endpoint enter the ready queue before the partially completed running job is requeued. The CPU idles when no task is ready. There is no I/O or context-switch penalty.

For each completed task:

```
turnaround = finish - arrival
wait = turnaround - burst
```

A and B can have the same aggregate waiting time under different quanta; the UI must still recalculate their timeline. Different policies are not evaluated against real hardware.
