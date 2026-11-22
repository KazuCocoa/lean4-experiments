# Lean 4 experiments

A small proof-of-concept for specifying JavaScript state machines in Lean 4 and checking their safety properties.

## Session lifecycle

The JavaScript implementation lives in `src/session.mjs`. The independent Lean specification is `LeanExperiments.lean`.

The model has two states (`active`, `closed`) and two commands (`execute`, `close`). `execute` is accepted while active, and rejected after closing. `close` is idempotent.

Lean formally proves:

- `closed_rejects_execute`: a closed session rejects execute;
- `close_is_idempotent` and `close_always_closed`;
- `closed_is_absorbing`: **every finite suffix** of requests leaves a closed session closed;
- `no_execute_after_close`: **every finite suffix** between a close and a subsequent execute still causes that execute to be rejected.

`src/schedule.mjs` evaluates an explicit *linearization* (a sequential ordering of atomic requests) and records accepted/rejected operations. Node tests cover both possible close/execute orders and exhaustively enumerate all binary command schedules of length 0–8 from each initial state (1,022 cases).

### Run locally

Install [elan / Lean 4](https://lean-lang.org/install/) and Node.js 22+:

```sh
lean LeanExperiments.lean
node --test
```

The `lean-toolchain` file pins the Lean release. GitHub Actions checks Lean proofs and JavaScript tests.

### Scope and limitations

This **does not** prove the JavaScript implementation correct. Lean verifies properties of its **Lean model**; the finite JavaScript tests separately check the implementation on enumerated schedules. A machine-checked refinement or a shared executable specification would be needed to bridge that gap.

The concurrency example assumes each request is *atomic* and has a well-defined linearization order. It does **not** prove real-world thread safety, absence of races at instruction-level interleavings, fairness, or lock correctness. In particular, production Appium sessions are much more complex than this deliberately minimal model.

Useful next step: model a non-atomic close operation (read-state, mark-closing, free-resources) and a competing execute as separate steps; demonstrate an unsafe interleaving and repair it with a protocol invariant.
