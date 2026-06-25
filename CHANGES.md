# Development Changes Log

---

## Round 1 — 6-Item UI Polish

### 1. Step UI Reorder — Knowledge Check after Hint
The Knowledge Check (quiz) block was moved to render **after** the Show Hint toggle in the step renderer.

New order inside every step card:
1. Step Objectives (green box)
2. Instruction (blue alert) — with `instructionBullets` sub-steps
3. Hint toggle (yellow)
4. Knowledge Check quiz (purple) ← moved here
5. CPU idle warning (orange)
6. Feedback alert
7. Action buttons

### 2. `terminate` Event Bug Fix (Scenario 1 Shortest Path)

**Root cause:** `generateExternalEvents()` in `lib/simulation-engine.ts` had a gate that blocked `terminate` from being generated whenever a pending `io_needed` event existed:

```typescript
// Before (buggy):
const eligible = !hasIOEvent && (process.history.includes("blocked") || timeRunning >= 4)
```

This meant that once `io_needed` appeared at `timeRunning === 2`, the user could never see a `terminate` event by ignoring the I/O — making the "shortest valid path" scenario impossible to complete.

**Fix:**

```typescript
// After (fixed):
const eligible = (process.history.includes("blocked") && !hasIOEvent) || timeRunning >= 4
```

`terminate` is now eligible after 4 ticks regardless of any pending `io_needed`. Both events can coexist in the queue — the user chooses which path to take.

### 3. `instructionBullets` — Multi-step Instructions

Added `instructionBullets?: string[]` to the `GuidedStep` interface. When present, sub-steps render as a numbered list below the main instruction text. Supports `**bold**` via `renderBold()`.

24 multi-action steps across all 10 scenarios were updated with `instructionBullets`. Example (`s1-terminate`, synced with the engine fix):

```
instruction: "Advance the clock until a terminate event appears, then select it and terminate the process.",
instructionBullets: [
  "Click Advance Clock twice. After 2 advances, an io_needed event appears — the process is signalling I/O.",
  "Continue advancing 2 more times (4 total) without acting on io_needed. A Terminated event will appear.",
  "Click the Terminated event in Event Requests to select it.",
  "Click Terminate on the running process. The process moves from CPU to Terminated.",
],
hint: "You will see both an io_needed and a Terminated event — ignore io_needed and use the Terminated event instead."
```

### 4. Header Alignment — `max-w-7xl`

The header container was missing `max-w-7xl`, causing the "Shortcuts" and "Reset All" buttons to sit outside the bounds of the main content area on wide screens.

```jsx
// Before:
<div className="container mx-auto px-2 sm:px-4 py-3 sm:py-4">

// After:
<div className="container mx-auto px-2 sm:px-4 py-3 sm:py-4 max-w-7xl">
```

### 5. Responsiveness — Scenario Header Mobile Fix

The scenario header in `guided-scenarios.tsx` was using `flex items-center justify-between`, which caused the title and elapsed timer to overflow horizontally on narrow screens.

```jsx
// Before:
<div className="flex items-center justify-between">

// After:
<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
  <div className="min-w-0 flex-1">
    <CardTitle className="... break-words">
```

The hint row was similarly fixed to `flex flex-col sm:flex-row`.

### 6. Remove "Selected Process" Readout

The "Selected Process: P1 / None" display block was removed from the Controls card. The `selectedProcess` state was kept — it is consumed by the move panel (shown when a process is selected) and the blue ring highlight on all process badges.

### 7. Typography Hierarchy Upgrade

- Section headings (`h3`): `text-xs sm:text-sm` → `text-sm sm:text-base`
- Lane headings (`h4`, CPU / Ready / I/O wait / Terminated): `font-medium` → `font-semibold`

### 8. Info Button Placement — Adjacent to Label

Three card headers had `flex-1` on the title `<span>`, which pushed the Info tooltip button far to the right of the label text. Fixed by wrapping the title text and Info button together in a shared `flex-1` span:

```jsx
// Process Life Cycle Sandbox / Metrics & Log:
<span className="flex items-center gap-1 flex-1 min-w-0">
  <span className="break-words">Process Life Cycle Sandbox</span>
  <Tooltip>...(Info)...</Tooltip>
</span>

// System States (Export button stays at far right):
<span className="flex items-center gap-1 flex-1">
  System States
  <Tooltip>...(Info)...</Tooltip>
</span>
<DropdownMenu>...Export...</DropdownMenu>
```

---

## Round 2 — Keyboard Shortcuts

### What was added

15 keyboard shortcuts across three layers:

```
┌─────────────┬────────────────────────────────────────────────────────┬────────────────────────────┐
│     Key     │                         Action                         │          Active on         │
├─────────────┼────────────────────────────────────────────────────────┼────────────────────────────┤
│ Alt+1/2/3   │ Switch tabs                                            │ Always                     │
├─────────────┼────────────────────────────────────────────────────────┼────────────────────────────┤
│ ? (Shift+/) │ Toggle shortcuts dialog                                │ Always                     │
├─────────────┼────────────────────────────────────────────────────────┼────────────────────────────┤
│ Space / A   │ Advance Clock                                          │ Sandbox & Scenarios tabs   │
├─────────────┼────────────────────────────────────────────────────────┼────────────────────────────┤
│ Z           │ Step Back (undo last clock advance)                    │ Sandbox & Scenarios tabs   │
├─────────────┼────────────────────────────────────────────────────────┼────────────────────────────┤
│ C           │ Create Process                                         │ Sandbox & Scenarios tabs   │
├─────────────┼────────────────────────────────────────────────────────┼────────────────────────────┤
│ E           │ Select Next Event (cycles through queue)               │ Sandbox & Scenarios tabs   │
├─────────────┼────────────────────────────────────────────────────────┼────────────────────────────┤
│ G           │ Dispatch selected process to CPU                       │ Sandbox & Scenarios tabs   │
├─────────────┼────────────────────────────────────────────────────────┼────────────────────────────┤
│ I           │ Move selected process to I/O Wait                      │ Sandbox & Scenarios tabs   │
├─────────────┼────────────────────────────────────────────────────────┼────────────────────────────┤
│ R           │ Preempt selected process to Ready                      │ Sandbox & Scenarios tabs   │
├─────────────┼────────────────────────────────────────────────────────┼────────────────────────────┤
│ T           │ Terminate selected process                             │ Sandbox & Scenarios tabs   │
├─────────────┼────────────────────────────────────────────────────────┼────────────────────────────┤
│ Escape      │ Deselect process / event                               │ Sandbox & Scenarios tabs   │
├─────────────┼────────────────────────────────────────────────────────┼────────────────────────────┤
│ Shift+R     │ Reset Simulation (Sandbox) / Reset Scenario (Scenarios)│ Respective tab             │
├─────────────┼────────────────────────────────────────────────────────┼────────────────────────────┤
│ Enter       │ Check & Complete Step                                  │ Scenarios tab, step active │
├─────────────┼────────────────────────────────────────────────────────┼────────────────────────────┤
│ H           │ Toggle Hint                                            │ Scenarios tab, step active │
├─────────────┼────────────────────────────────────────────────────────┼────────────────────────────┤
│ B           │ Go Back to scenario list                               │ Scenarios tab, step active │
└─────────────┴────────────────────────────────────────────────────────┴────────────────────────────┘
```

### Architecture changes

- **`ProcessSchedulingSimulation` converted to `forwardRef`** exposing `SimulationHandle` — `GuidedScenarios` calls simulation actions (advance clock, step back, move process, etc.) via the ref without needing to own engine state.

- **Shortcuts are tab-gated** (`isActiveTab` prop) so keys don't fire on hidden tabs. Each component registers its own shortcuts locally; `useKeyboardShortcuts(shortcuts, shortcutsEnabled && isActiveTab)`.

- **`?` shortcut** is wired to `shortcutsDialogOpen` state in `app/page.tsx` so it toggles the panel from anywhere in the app.

- **All shortcut defs visible in the dialog** — `SIMULATION_SHORTCUT_DEFS` and `SCENARIO_SHORTCUT_DEFS` are exported as static arrays and merged in `app/page.tsx` into `allShortcutDefs` passed to `KeyboardShortcutsDialog`. The dialog accepts `ShortcutDef[]` (display-only, no `action` field) so it can render defs from any component without needing callable references.

- **`isInteractiveFocused()` updated** to also block shortcuts when a `button`, `a`, or `role=button` element has focus. This prevents `Space`/`Enter` from double-firing (once via shortcut, once via the focused button's click handler).

- **Embedded simulation in `GuidedScenarios`** must always receive `isActiveTab={false}` — the parent owns the simulation keyboard shortcuts and drives the engine via the ref. Passing `isActiveTab={false}` ensures the embedded component does not register a duplicate set of listeners.

### Files changed

| File | Change |
|------|--------|
| `hooks/use-keyboard-shortcuts.ts` | Added `ShortcutDef` type; updated `isInteractiveFocused` to include button/anchor/role=button |
| `components/keyboard-shortcuts-dialog.tsx` | Accepts `ShortcutDef[]` (not `ShortcutAction[]`); added `open`/`onOpenChange` props; `Space` key renders as "Space" not " " |
| `components/process-scheduling-simulation.tsx` | `forwardRef` + `SimulationHandle`; memoized all handlers with `useCallback`; `selectedProcessRef` for stable closure in shortcut actions; exports `SIMULATION_SHORTCUT_DEFS` |
| `components/guided-scenarios.tsx` | Added `simulationRef`; registers simulation + scenario shortcuts; passes `ref` and `isActiveTab={false}` to embedded sim; exports `SCENARIO_SHORTCUT_DEFS` |
| `app/page.tsx` | `shortcutsDialogOpen` state; `?` shortcut; `allShortcutDefs` merged for dialog; `isActiveTab` and `shortcutsEnabled` passed to components |


# Claude Code Task (Round 3): Visual, Structural & Pedagogical Refinements to the CPU Scheduling Learning Simulator

This continues the same project (React + Tailwind, Lucide icons; guided **Scenarios**, a **Sandbox**, **Metrics/System States**, process-state visualizations). Prior rounds added: per-step knowledge verification + simulation-task validation, the Objectives → Instructions → **Show hint** → **Knowledge check** order, Reverse Advance, `sky-500` Ready state, the "CPU must stay busy" rule, detailed bulleted instructions, responsiveness work, and a typography hierarchy. Keep all of that intact; this round refines and extends it.

## Ground rules (unchanged)

1. **Reconnaissance first.** Re-locate the relevant code before editing (tab/layout shell, Sandbox controls + display, Metrics/System States, scenario step renderer + scenario data, simulation/scheduler engine, shared typography/color/border tokens, tooltip definitions, the info-button component). Summarize the files you'll touch per item before changing them.
2. **Single source of truth.** Fix shared tokens/components once.
3. **No regressions.** Preserve all prior acceptance criteria (validation gating, Reverse Advance history, sky-500, keep-CPU-busy, etc.).
4. **Verify completeness** with grep/search wherever an item says "throughout/everywhere/all."
5. **PEDAGOGICAL REVIEW GATE (important):** Before implementing the architectural/pedagogical items (Section F), evaluate each for **OS-theory correctness**. If any proposed mechanic is pedagogically wrong or misleading, do NOT silently implement it — implement the correct version and clearly flag the deviation and your reasoning. Correctness of the lesson takes priority over literal instruction-following here.
6. Work section-by-section; give a concise per-item changelog. Ask before any schema change affecting persisted/saved state.

---

## Section A — Global copy/voice: remove ALL imperative statements

Convert **every piece of UI copy in the entire project** from imperative/command voice (and second-person "you will learn/understand") to neutral, **declarative** voice describing what the feature is or what can be done.

- Imperative (wrong): "Use these controls to manage the sandbox. Create processes and move them between states to learn the process life cycle."
- Declarative (right): "These controls manage the sandbox. Processes can be created and moved between states using the controls."
- Also remove phrasings like "you will learn…", "you will understand…", "learn that…". State what the experiment/feature **does** or what **can be done**, not what the user is commanded to do or promised to learn.

Apply this principle to **all** text: info-button tooltips, section descriptions, scenario objectives, instructions, hints, evaluation copy — everywhere. Grep for second-person/imperative patterns and report what you changed.

---

## Section B — Typography hierarchy (apply project-wide)

Enforce a strict, consistent size hierarchy so panel headings are clearly larger than their subsections, reducing navigation load. Levels, from largest to smallest (illustrative ratios, not literal px — define as shared classes/tokens):
- **Panel/section title** (e.g., "Process Life Cycle Sandbox") — largest.
- **Sub-section heading** (e.g., "Event Requests", "Processes and Current State") — clearly smaller than the panel title.
- **Item/label level** (e.g., "CPU", "Ready", state labels) — smaller again.

The same role must always use the same size/weight across every view. Fix any place where headings and their children look the same size or where importance is visually inverted. Keep it consistent across breakpoints (works with the existing responsiveness).

Specifically: **"Guided Learning Scenarios" and "Process Life Cycle Evaluation" must use the same text size** as each other (they currently differ).

---

## Section C — Buttons: 3D, shadowed, stronger hover

Make buttons look tactile and 3D: add resting **shadows** so they appear raised. On **hover**, make the effect clearly more pronounced than the current subtle state — the button should **grow slightly** (subtle scale-up) **and shift color more noticeably** (and deepen/raise the shadow). The current hover is too subtle; increase its magnitude while keeping it tasteful. Apply consistently via the shared button component/classes.

---

## Section D — Tabs

1. **Reorder** the main tabs to: **Scenarios** (first), **Sandbox** (middle), **Evaluation** (last).
2. **Inactive tab color:** darken inactive tabs so active vs. inactive is clearly distinguishable. (On large/4K displays the current light-grey inactive tabs read as plain white; use a darker grey so the distinction survives bright, less-color-accurate screens.)
3. **Tooltips (hover text) for Scenarios, Sandbox, and Evaluation:** rewrite to be **more comprehensive** (describe what each area does), in declarative voice (Section A), and **remove any mention of keyboard shortcuts** — shortcuts have their own dedicated button.

---

## Section E — Borders, outlines, and dividers

Darken the greys used for: **section outlines**, **grey button outlines**, and the **divider lines between sub-sections**. Currently they're too light (especially on bright/4K screens). Use a darker grey token consistently so structure is visible without being heavy. Update the shared border/divider token(s).

---

## Section F — Layout, structure & pedagogical/architectural changes

### F1. Sandbox layout regions
- **Current Time** belongs in the **Display (middle section)**, not in Controls. Move it there so the page's region distinctions (controls / display / etc.) are clean.
- **Remove the Legend entirely** — process states are already color-coded.
- **Advance Clock button:** give it a **forward-pointing icon** (the mirror of the Revert/Step-Back icon; pointing forward).
- **Rename the "Step Back" button to "Revert Clock"** (keep its existing Reverse-Advance functionality from the prior round).
- **Remove the redundant "Selected Process"** readout from Controls (if not already removed).

### F2. "Valid attempts" section (renamed from "Valid transitions")
- Valid transitions is **not part of Controls**. Create a **small dedicated section directly below Controls** for it, preserving the overall layout structure.
- **Rename "Valid transitions" → "Valid attempts".**
- Replace the **text** representation with a **state-diagram graphic** (see Section G for the exact spec), using project colors.

### F3. State Presence → dedicated scrollable Metrics section
- Restyle **State Presence** to match the **Action Log** design, and give it its own **dedicated, scrollable section inside the Metrics area** (exactly like Action Log has). Scrolling ensures the page **does not grow/extend** when many processes are created — the overall structure stays fixed.

### F4. System States / Metrics cleanup
- **Remove "Current State Summary"** from System States — redundant.
- **System States must also capture invalid transition attempts** so they're available for evaluation (record each rejected/invalid transition the user attempts, with enough detail to evaluate against).
- **Remove the "Completed Processes" metric** entirely.

### F5. Event Requests → add an Event Catalog
- Add an **Event Catalog** section **directly below "Event Requests"** listing **all possible event types** that can be generated in Event Requests (e.g., I/O-needed, I/O-complete, terminate, preempt, etc. — enumerate exactly the events the engine can emit), each with a short declarative description. Keep it consistent with the events the engine actually produces.

### F6. Scenarios content fixes
- **Remove the "Infant" state completely** — there is no such state. Scenario 0 (and anywhere else) must reflect the real states only: **Ready, CPU (Running), I/O Wait, Terminated** (plus the entry "New process" admission). Verify no "Infant" reference remains anywhere.
- Fix Scenario 0 objectives that are imperative ("Understand the five process states…", "Learn that processes can only be terminated from the CPU…") → declarative, per Section A (e.g., "This experiment covers the process states Ready, CPU, I/O Wait, and Terminated and the transitions between them. A process can be terminated only from the CPU (Running) state."). Apply this voice to all scenario objectives/instructions/hints.
- **Remove the subtitle** "Learn process life cycle management through interactive, step-by-step guided scenarios with immediate feedback and hints." beneath "Guided Learning Scenarios" (it's redundant and imperative).
- **Remove the subtitle** "Comprehensive scenarios to evaluate your understanding of process states, valid transitions, and event-driven state changes." beneath "Process Life Cycle Evaluation" (redundant).
- **Change the "Process Life Cycle Evaluation" icon** — it currently matches the Instructions icon; choose a distinct, appropriate Lucide icon (e.g., a checklist/clipboard-check/graduation-style icon).

### F7. Architectural: transitions are an ordered SET (full lifecycle), CPU never idle while Ready non-empty
Scenario evaluation must require a **sequence of transitions** (the clock does not auto-advance), not single hops. Because multiple processes can be Ready, the CPU must not be left empty when a runnable process exists (consistent with the prior "keep CPU busy" rule).

Worked example to model the evaluation logic on — "drive P1 through a full cycle to Terminated" with P1 and P2 both initially Ready:
P1 → CPU, then P1 → I/O, then **P2 → CPU** (CPU shouldn't sit empty), then P1 → Ready (I/O completed), then P2 → I/O, then P1 → CPU, then P1 → Terminated.

Generalize this: scenario steps that involve multiple processes must validate the **whole ordered transition set**, enforce that the CPU is occupied whenever a Ready process is available, and only mark the step complete when the correct full sequence has been performed. **Verify this is pedagogically correct** (single-core, non-preemptive vs. preemptive assumptions) and adjust the canonical accepted sequence(s) accordingly — if multiple valid orderings exist under the model, accept any valid ordering rather than one hardcoded path, and explain your choice.

### F8. State-presence timing bug + "no dispatch on creation cycle" rule
Bug: creating P1 at clock = 4 and moving it to CPU **without advancing the clock** leaves State Presence showing "Ready 0" (the time spent isn't picked up).
- Fix the **time-accounting** so State Presence records time correctly.
- Add the rule that a **newly created process cannot be dispatched to the CPU in the same clock cycle it was created** — it must spend at least one cycle in Ready first (a newly admitted process enters the Ready queue and is dispatched on a subsequent scheduling decision). Fold this rule into the transition-set validation in F7.
- **Confirm this is pedagogically sound** before implementing; if the correct model differs, implement the correct version and explain.

### F9. Step completion gating (reconfirm + alerts)
A scenario step is completable **if and only if** (a) the knowledge check is answered **correctly** AND (b) the instructions/required transitions have been fully followed. Until both hold, the **Complete Step button stays inactive**. If the user attempts to click it prematurely, show a **clear, relevant alert** stating exactly what's still missing (which condition is unmet). This must not be bypassable.

---

## Section G — State diagram spec for "Valid attempts" (rebuild from the reference image)

Recreate the attached process-state diagram as a **responsive inline SVG (or lightweight component)** using **project colors and terminology**. Match the reference layout. (If possible, attach the reference image in the Claude Code session too.)

Nodes (circles with centered labels), positioned like the reference:
- **Ready** — blue (`sky-500`), left.
- **CPU** — green, center.
- **I/O** — yellow, below-center.
- **Terminated** — red, right.

Directed edges with labels (use the project's own event/transition names where they differ from the reference):
- Entry arrow into **Ready**, labeled "New process".
- **Ready → CPU**, labeled "Dispatch".
- **CPU → Ready** (curved, over the top), labeled "Preempt".
- **CPU → Terminated**, labeled "Terminate".
- **CPU → I/O**, labeled per the project's wait/I-O-request event (reference text: "Resource or wait request").
- **I/O → Ready**, labeled per the project's I/O-complete event (reference text: "Resource granted or wait completed").

Colors must exactly match the project's state colors (Ready/blue, CPU/green, I/O/yellow, Terminated/red). Make it scale cleanly across breakpoints. Place it in the Valid attempts section.

> NOTE FOR CLAUDE CODE: the user's instruction "place it below Terminated" is ambiguous. Default to rendering the full diagram as the content of the Valid attempts section. If "below Terminated" refers to a specific existing layout element, flag it rather than guessing.

---

## Final deliverables

1. Reconnaissance summary of files touched per item.
2. All sections implemented; prior-round behavior intact.
3. **Pedagogical-review notes** for Section F (F7, F8 especially): what you confirmed correct, and any place you deviated from the literal instruction to stay pedagogically correct, with reasoning.
4. Grep/search proof for project-wide items: no imperative/"you will" copy remains (A), no "Infant" reference remains (F6), typography roles consistent (B).
5. The Event Catalog matches the engine's actual emitted events (F5).
6. Passing build/lint (and tests if present), plus a concise per-item changelog.

Ask before changing the scenario schema in a way that affects persisted/saved state, or before removing state that has other consumers.

---

## Round 3 — Refactoring-UI Visual Pass + Drag-and-Drop

A visual refactor based on *Refactoring UI* (see `REFACTORING-UI-REVIEW.md`), applied one item at a time. Each item was verified loop-free under a hard memory cap (`systemd-run --user --scope -p MemoryMax=2G -p MemorySwapMax=0`) before committing, because an earlier attempt at items 1–2 had caused a system-wide OOM. Production builds stayed bounded (~650 MB) throughout.

> **Note on the dev-mode OOM:** `next dev` (Turbopack) for this `-exp` checkout balloons past 6 GB on first compile and is OOM-killed — but this is **pre-existing**. The base commit (`90d0745`, before any of these changes) reproduces it identically, and every production `next build` succeeds at ~650 MB. The refactor is not the cause. Use a production build (`next build` + `next start`) to preview.

### 1. Use fewer borders
Collapsed the three-deep border nesting in the Sandbox (Card border → inner gray box → dashed drop zone) down to **one separation method per level**: the Card keeps its border, lanes / event queue / action log / metric boxes keep `bg-gray-50`, and inner content separates with spacing only. All dashed and redundant middle-box borders removed. Lightened the global `--border` token `oklch(0.83)` → `oklch(0.89)` (literal value only — never references another token, to avoid a circular `@theme` chain).
**Files:** `components/process-scheduling-simulation.tsx`, `app/globals.css`
**Commit:** `refactor(ui): use fewer borders — separate with background + space`

### 2. Yellow/sky button text contrast (WCAG)
The `warning` (→ I/O) variant was `bg-yellow-500` with white text (fails WCAG) — changed the label to `text-yellow-950` (dark on yellow), keeping the yellow fill. Also darkened the borderline `ready` variant `sky-500` → `sky-600` so its white text clears contrast. *(The sky part was later reverted in change 8 by design.)*
**Files:** `components/ui/button.tsx`
**Commit:** `fix(a11y): yellow/sky button text contrast (WCAG)`

### 3. Unify the shadow light source
Button hover shadows were offset down-right (`6px 9px…`) while Cards use a straight-down `shadow-sm`, implying two light sources. Set the button hover-shadow x-offset to `0` (straight down) to match the Cards. Per-hue shadow tints unchanged — only the direction is unified.
**Files:** `components/ui/button.tsx`
**Commit:** `style(buttons): unify shadow light source to straight-down`

### 4. De-emphasize info icons + tint text on colored panels
Recolored the ~14 tooltip ⓘ icons from `text-blue-600` to `text-muted-foreground`, and removed them entirely from self-explanatory headings (Controls, Action Log). Kept the blue Instructions-alert icon tinted to its own panel hue. Changed grey body text on colored panels (green-50 completion card / scenario header) from `text-muted-foreground` to `text-green-700`; alert bodies already used tinted `*-800` text.
**Files:** `components/process-scheduling-simulation.tsx`, `components/scenario-evaluation.tsx`, `components/guided-scenarios.tsx`
**Commit:** `style(ui): de-emphasize info icons; tint text on colored panels`

### 5. One meaning per color — difficulty badges off state hues
Difficulty badges were green/yellow/red, colliding with the Ready/CPU/I-O/Terminated state hues. Recolored them to a neutral **slate** ramp distinguished by intensity, locking sky/green/yellow/red to states only. (Blue's overload as "informational" was already removed in change 4.)
**Files:** `components/guided-scenarios.tsx`, `components/scenario-evaluation.tsx`
**Commit:** `style(ui): one meaning per color — difficulty badges off state hues`

### 6. Roomier move-panel buttons (whitespace)
The Move Process buttons were cramped (`text-xs px-1 py-1`, `gap-1`). Bumped to `text-sm px-3 py-2` in a `gap-2` grid for comfortable hit areas. *(This panel was later removed entirely in change 9.)*
**Files:** `components/process-scheduling-simulation.tsx`
**Commit:** `style(ui): roomier move-panel buttons (whitespace)`

### 7. Widen type-scale weight ladder for hierarchy
The `subsection-title` and `item-label` tiers were only 100 font-weight apart. Widened the ladder to **800 / 700 / 500** (panel / subsection / item-label). Font **sizes were left untouched** because they drive the tuned fixed-height layout — hierarchy now comes from weight, not size.
**Files:** `app/globals.css`
**Commit:** `style(ui): widen type-scale weight ladder for hierarchy`

### 8. Revert Create Process button to sky-500
The `ready` button variant carries the semantic Ready-state colour: a created process enters the Ready queue, and the Ready lane + Ready chips are `sky-500`. Reverted the change-2 contrast darkening (`sky-600`) for this variant so the Create Process button matches the state colour again. The yellow-button fix from change 2 is untouched.
**Files:** `components/ui/button.tsx`
**Commit:** `revert(buttons): keep Create Process (ready variant) at sky-500`

### 9. Drag-and-drop process moves (mouse + touch)
Removed the "Move Process" button panel. Processes are now moved by **dragging a chip onto a lane** (CPU / Ready / I/O / Terminated). Built on **Pointer Events** so it works with mouse, pen, and touch (phones) — not HTML5 `draggable`. Details:
- chips use `touch-action: none` + pointer capture so dragging a chip doesn't scroll the page;
- the drop lane is resolved by hit-testing the pointer position (`elementFromPoint` → `data-lane-state`);
- the hovered lane highlights in its own state hue;
- the drag preview is portaled to `<body>` with `pointer-events: none` so it never blocks hit-testing.
A quick **tap still selects** a chip (keyboard `G/I/R/T` still work); a real drag suppresses the trailing click. Moves still pass through engine validation.
**Files:** `components/process-scheduling-simulation.tsx`
**Commit:** `feat(sandbox): drag-and-drop process moves (mouse + touch)`

---

## Round 4 — Dev-server OOM Root Cause: Turbopack, not the UI

### Symptom
`pnpm dev` froze the whole machine (RAM filled, swap thrashed, OS killed the browser/terminal). Earlier rounds blamed the Refactoring-UI pass (darkened `--border` OKLCH token, info-icon/tooltip changes) and treated it as a "circular CSS token / ResizeObserver loop." That diagnosis was wrong — the freeze persisted on clean, committed code when running the dev server.

### Root cause
The OOM is **Turbopack's dev compiler** on this **Next.js 16.2.0 / Node v26** setup — it balloons past 2 GB while compiling `/`. It is **not** related to any UI/CSS change.

Reproduced under a hard memory cap (`systemd-run --user --scope -p MemoryMax=2G -p MemorySwapMax=0`), so a runaway only killed its own scope:

| Command | Result |
|---|---|
| `next dev` (Turbopack) | **oom-kill at 2 GB** compiling `/` |
| `next dev` (Turbopack), `globals.css` stripped to just `@import "tailwindcss";` | **still oom-kill at 2 GB** — exonerates all CSS |
| `next dev --webpack` | HTTP 200, memory flat ~0.7–1 GB across requests |
| `next build` (Turbopack) | clean in ~1.6 s |

Stripping the stylesheet to one line still OOMs, and `next build` uses Turbopack yet compiles the identical code fine. The only variable that flips OOM→stable is the **Turbopack dev path**. Earlier verification passed because it used the production build, which never exercises that path.

### Fix
Pin the dev server to the webpack compiler:

```diff
- "dev": "next dev",
+ "dev": "next dev --webpack",
```

Verified via the real `pnpm dev` under the cap: server stays up, all requests 200, memory stable at 705 MB (peak 862 MB), no oom-kill. Static review confirmed the committed app code is loop-free (no circular `@theme` tokens, no `ResizeObserver`, parent callbacks are `useCallback([])`-stable).

**Note:** to revisit Turbopack later (Next patch, or pinning Node to an LTS — v26 is bleeding-edge), re-test under the memory cap before dropping `--webpack`.

**Files:** `package.json`
**Commit:** `fix(dev): use webpack dev server — Turbopack dev OOMs on Next 16.2/Node 26`
