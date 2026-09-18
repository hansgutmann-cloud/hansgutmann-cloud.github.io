# INVARIANT — Design rationale

## The central decision

Demonstrate precision through the behavior of the site rather than through claims about its owner. The visitor sees an approachable research homepage first. The deeper layer is optional, discoverable and inspectable.

## Three reading speeds

At a glance: name, research interests, three directional cards and a clear navigation structure.

In a minute: selected notes, a coherent personal statement, a direct contact/profile route.

In depth: the knot parameterization, emitted intermediate representations, executable Wasm, a finite group, an address trace, and a scheduling policy with explicit assumptions.

## Visual language

Warm near-white paper and quiet green ink. Copper is reserved for emphasis, technical annotations and the mathematical sculpture. The hierarchy follows editorial design: a large serif statement, readable body copy, small monospaced marginalia and hairline rules.

System font stacks keep the deployment self-contained and avoid font downloads. There are no packaged font binaries.

The homepage uses a 1240px maximum content width, balanced two-column hero, three research cards, a full-width green laboratory, horizontal notes and a two-column About block. At narrow widths, the reading order becomes linear and ordinary navigation remains visible.

## Motion

Motion belongs to the object, not to the interface. No scroll hijacking, spinning page transitions, fake boot loader, custom cursor, moving targets or autoplay audio. The sculpture can rotate slowly when a GPU backend is available, but can be paused and respects reduced-motion preferences. Hover states are short and spatially small.

## Technical honesty

The sculpture has a real parameterization. The compiler emits an actual module. The algebra table is constructed. The system timelines are calculated, not animated recordings. A backend label describes the path actually in use. Model statistics are not hardware performance claims.

The source is small enough to read without a framework's architecture becoming the main subject. This is a deliberate choice, not an argument that frameworks are inferior.

## Content honesty

The owner's name and broad research interests are prefilled. Email, CV and Scholar are intentionally missing until supplied. Research cards are labeled directions rather than fabricated publications, awards or positions. The included notes are template essays, not claims to prior publication.

## Things deliberately omitted

Skill meters, technology-logo walls, an obligatory command-line interface, invented CPU utilization, a talking avatar, a particle universe, third-party telemetry, and unnecessary build tooling.

## Suggested customization order

Replace the public biography and links, then the three directions, then real publications or projects. Keep the interaction layer unless its assumptions conflict with the content. Change visual tokens only after the content hierarchy is stable.
