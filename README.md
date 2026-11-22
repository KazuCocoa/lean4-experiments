# Lean 4 experiments

Small, auditable experiments in modeling JavaScript behavior with Lean 4.

## First experiment: session lifecycle

`src/session.mjs` implements a minimal session transition function.
`LeanExperiments.lean` independently models the same finite state machine and proves:

- closed sessions reject execute commands;
- closing is idempotent;
- closing always produces a closed state;
- executing in an active session preserves its state.

The JavaScript tests enumerate the finite state space. They are **not** a machine-checked refinement proof that the JavaScript implementation matches Lean. Lean proves only properties of the Lean model. This distinction is intentional.

## Run

Install [elan](https://lean-lang.org/install/) and Node.js 22+.

```sh
lake env lean LeanExperiments.lean
node --test
```

The Lean toolchain is pinned in `lean-toolchain`. GitHub Actions runs both checks.

## What this does *not* prove

The example does not establish correctness of Appium, real session lifecycles, thread safety, or concurrent execution. Real concurrency requires modeling interleavings, atomicity, and the concrete implementation's semantics. A next experiment could model competing close/execute operations with explicit schedules and prove safety invariants.

## Scope

Educational proof-of-concept. No dependencies on Appium or Mathlib.
