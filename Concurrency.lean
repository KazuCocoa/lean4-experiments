/-!
# Close/execute interleaving experiment

A broken two-step execute lifecycle demonstrates a use-after-release.
The corrected model uses a closing phase to defer release until the
in-flight operation finishes. All operations are treated as atomic steps.
-/

inductive Op where
  | beginExecute
  | requestClose
  | finishExecute
  deriving DecidableEq, Repr

inductive UnsafePhase where
  | idle
  | executing
  | releasedWhileExecuting
  | closed
  deriving DecidableEq, Repr

def unsafeStep (phase : UnsafePhase) (op : Op) : UnsafePhase :=
  match phase, op with
  | .idle, .beginExecute => .executing
  | .idle, .requestClose => .closed
  | .executing, .requestClose => .releasedWhileExecuting
  | .executing, .finishExecute => .idle
  | .releasedWhileExecuting, .finishExecute => .closed
  | s, _ => s

theorem unsafe_interleaving_releases_inflight :
    unsafeStep (unsafeStep .idle .beginExecute) .requestClose =
      .releasedWhileExecuting := by
  rfl

inductive SafePhase where
  | idle
  | executing
  | closingExecuting
  | closed
  deriving DecidableEq, Repr

def safeStep (phase : SafePhase) (op : Op) : SafePhase :=
  match phase, op with
  | .idle, .beginExecute => .executing
  | .idle, .requestClose => .closed
  | .executing, .requestClose => .closingExecuting
  | .executing, .finishExecute => .idle
  | .closingExecuting, .finishExecute => .closed
  | s, _ => s

def isExecuting : SafePhase → Bool
  | .executing | .closingExecuting => true
  | _ => false

def isReleased : SafePhase → Bool
  | .closed => true
  | _ => false

def isClosing : SafePhase → Bool
  | .closingExecuting | .closed => true
  | _ => false

def safeRun (s : SafePhase) : List Op → SafePhase
  | [] => s
  | op :: rest => safeRun (safeStep s op) rest

-- For every finite execution schedule, a state cannot simultaneously
-- represent executing and released resources.
theorem never_execute_with_released_resources (s : SafePhase) (ops : List Op) :
    ¬ (isExecuting (safeRun s ops) = true ∧
       isReleased (safeRun s ops) = true) := by
  cases safeRun s ops <;> decide

theorem closing_step (s : SafePhase) (op : Op)
    (h : isClosing s = true) :
    isClosing (safeStep s op) = true := by
  cases s <;> cases op <;> simp [isClosing, safeStep] at *

theorem close_starts_closing (s : SafePhase) :
    isClosing (safeStep s .requestClose) = true := by
  cases s <;> decide

theorem closing_persists (s : SafePhase) (ops : List Op)
    (h : isClosing s = true) :
    isClosing (safeRun s ops) = true := by
  induction ops generalizing s with
  | nil => simpa [safeRun] using h
  | cons op rest ih =>
      exact ih (safeStep s op) (closing_step s op h)

theorem close_is_permanent (s : SafePhase) (ops : List Op) :
    isClosing (safeRun (safeStep s .requestClose) ops) = true := by
  exact closing_persists (safeStep s .requestClose) ops (close_starts_closing s)

theorem close_defers_release :
    safeStep (safeStep .idle .beginExecute) .requestClose =
      .closingExecuting := by
  rfl

theorem finish_releases_after_close :
    safeStep .closingExecuting .finishExecute = .closed := by
  rfl

theorem begin_during_closing_is_rejected :
    safeStep .closingExecuting .beginExecute = .closingExecuting := by
  rfl
