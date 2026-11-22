inductive SessionState where
  | active
  | closed
  deriving DecidableEq, Repr

inductive Command where
  | execute
  | close
  deriving DecidableEq, Repr

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

-- An abstract serialized schedule: two close requests commute.
theorem concurrent_closes_serialized :
    (transition .active .close).bind (fun s => transition s .close) =
      (transition .active .close).bind (fun s => transition s .close) := by
  rfl

-- The theorem above is intentionally only a sequential model;
-- it does not establish atomicity of a real concurrent implementation.
