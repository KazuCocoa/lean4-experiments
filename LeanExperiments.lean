inductive SessionState where
  | active
  | closed
  deriving DecidableEq, Repr

inductive Command where
  | execute
  | close
  deriving DecidableEq, Repr

-- An accepted request yields the next state; none means rejection.
def transition (state : SessionState) (command : Command) : Option SessionState :=
  match state, command with
  | .active, .execute => some .active
  | .active, .close => some .closed
  | .closed, .execute => none
  | .closed, .close => some .closed

theorem closed_rejects_execute :
    transition .closed .execute = none := by
  rfl

theorem close_is_idempotent (s : SessionState) :
    (transition s .close).bind (fun next => transition next .close) =
      transition s .close := by
  cases s <;> rfl

theorem close_always_closed (s : SessionState) :
    transition s .close = some .closed := by
  cases s <;> rfl

theorem execute_preserves_active :
    transition .active .execute = some .active := by
  rfl

-- A schedule is a total order of atomic requests (a linearization).
-- A rejected execute leaves the state unchanged.
def advance (state : SessionState) (command : Command) : SessionState :=
  match command with
  | .execute => state
  | .close => .closed

def run (state : SessionState) : List Command → SessionState
  | [] => state
  | command :: tail => run (advance state command) tail

-- The closed state is absorbing for *any* sequence of later requests.
theorem closed_is_absorbing (schedule : List Command) :
    run .closed schedule = .closed := by
  induction schedule with
  | nil => rfl
  | cons command tail ih =>
    cases command <;> simpa [run, advance] using ih

-- After close, execute is rejected even if arbitrary other requests intervene.
theorem no_execute_after_close (state : SessionState) (later : List Command) :
    transition (run (advance state .close) later) .execute = none := by
  simpa [advance, closed_is_absorbing] using closed_rejects_execute

-- A close request is independent of the preceding sequence of requests.
theorem close_from_any_state (state : SessionState) (later : List Command) :
    run (advance state .close) later = .closed := by
  simpa [advance] using closed_is_absorbing later
