# Refactoring UI Review — Process Life Cycle Lab

A critique of this project's UI measured against the principles in ***Refactoring UI*** (Adam Wathan & Steve Schoger). Each item maps a book principle → the flaw as it appears in this codebase → a concrete fix.

> Status: review only. No code has been changed by this document.

---

## Priority order (recommended)

1. Strip nested / dashed borders → separate with background + space *(highest visual payoff)*
2. Fix yellow-button text contrast *(accessibility, quick win)*
3. Unify the shadow light source
4. De-emphasize info icons + tint grey-on-color text
5. Separate difficulty badges from the state hues

Items 1–3 are single-source token/component changes and give the most lift with the least churn.

---

## 1. "Use fewer borders" — the biggest issue

**Principle.** Borders are the heaviest way to separate elements and quickly create clutter. Prefer background colors, spacing, or shadows.

**Flaw.** The UI is border-saturated. In the Sandbox, separators nest *three* deep:

- `Card` border →
- inner `bg-gray-50 border rounded-lg` box →
- `border-2 border-dashed border-gray-400` drop zone.

Every lane, event chip, metric block, and the System States panel is boxed. The global border token was also darkened to `oklch(0.83)` (for 4K legibility), which amplifies the clutter on normal screens.

**Fix.** Separate with **space and background color**, not lines. Keep the outer `Card`, drop the middle gray box, and replace dashed borders with a subtle `bg-gray-50` + padding. Use one separation method per nesting level.

---

## 2. "Emphasize by de-emphasizing" — info icons everywhere

**Principle.** Not everything can be emphasized; de-emphasize secondary affordances so primary content stands out.

**Flaw.** There are **15 identical blue ⓘ tooltip icons**, one on nearly every heading, all `text-blue-600`. They compete with each other and with real content. Heavy reliance on tooltips also signals that labels aren't self-explanatory.

**Fix.** Make the icons `text-muted-foreground` (grey) and remove them from headings that are already obvious ("Controls", "Terminated", "Action Log"). Reserve them for genuinely non-obvious things (State Presence, Valid Transitions).

---

## 3. Color — accent vs. semantic collision

**Principle.** Use one primary accent + a range of greys + a few semantic colors, each color carrying a single meaning.

**Flaw.**

- The state hues (sky = Ready, green = CPU, yellow = I/O, red = Terminated) are a good semantic system, **but the same hues are reused as chrome**: difficulty badges are green/yellow/red (a "beginner" green badge sits next to the green "running" lane).
- **Blue is overloaded** — primary button, info icon, current-time value, link, and active-tab border all use blue.

**Fix.** Lock sky/green/yellow/red to *states only*. Recolor difficulty badges to neutral/grey or a single brand accent. Pick one chrome accent and stop using it for both "primary action" and "informational."

---

## 4. "Don't use grey text on colored backgrounds"

**Principle.** Grey text on a colored background looks washed out; use a hand-picked tinted shade of the background's hue.

**Flaw.** Colored panels use plain grey text — e.g. the green-50 completion card and green-50 scenario header use `text-muted-foreground`; orange/yellow alert bodies are similar.

**Fix.** Use a darker tinted shade of the panel's own hue (e.g. `text-green-700` on `bg-green-50`).

---

## 5. Contrast / accessibility

**Principle.** Ensure sufficient text/background contrast; some hues (yellow) require dark text.

**Flaw.** The `warning` button variant (→ I/O) is `bg-yellow-500` with **white text**, which fails WCAG contrast. `bg-sky-500` + white is borderline.

**Fix.** Use dark text on yellow (`text-yellow-950`) or drop to `yellow-600`.

---

## 6. Depth — inconsistent light source

**Principle.** Shadows imply a single, consistent light source. Mixing shadow directions breaks the 3D illusion.

**Flaw.** Buttons cast a **down-right** shadow (`5px 7px …`), while `Card`s use `shadow-sm` (straight down).

**Fix.** Pick one light source. Either make cards cast the same down-right shadow, or make button shadows straight-down. Consistency over flashiness.

---

## 7. Text size & hierarchy

**Principle.** Build hierarchy with **weight and color**, not size alone; don't drown the UI in small text. Limit yourself to a defined type scale.

**Flaw.** Heavy reliance on tiny type — roughly **86 `text-xs` + 134 `text-sm`** usages; much of the UI is 12px. The gap between `subsection-title` and `item-label` is small.

**Fix.** Bump body text to `text-sm`/`text-base`, reduce `text-xs` usage, and differentiate tiers more with weight/muted color. The existing `panel / subsection / item-label` scale is good — just widen the contrast between tiers.

---

## 8. Spacing / breathing room

**Principle.** Start with more whitespace than feels necessary, then remove.

**Flaw.** Cramped targets — the move-panel buttons are `text-xs px-1 py-1`; several cards are tight.

**Fix.** Give the controls and chips more padding; fewer, larger, comfortable hit areas.

---

## What the project already does well (per the book)

- **Semantic color system** for states with consistent tokens. ✅
- **Empty states everywhere** ("No active events", "No process running") — the book dedicates a section to not forgetting these. ✅
- **Constrained line length** on tooltips (`max-w-xs`). ✅
- **A real type scale** (`panel / subsection / item-label`) and a spacing rhythm. ✅
- **Depth via shadows** on interactive elements. ✅
- **Per-hue button shadow tints** (a green button casts a green-tinted shadow, etc.) — aligns with "color to communicate." ✅

---

## Mapping summary

| # | Refactoring UI principle | Flaw location | Fix |
|---|--------------------------|---------------|-----|
| 1 | Use fewer borders | Nested card/box/dashed borders; dark border token | Background + spacing instead of lines |
| 2 | Emphasize by de-emphasizing | 15 blue info icons on every heading | Grey them; remove the obvious ones |
| 3 | One meaning per color | State hues reused for badges; blue overloaded | Lock state hues; single chrome accent |
| 4 | No grey text on color | `text-muted-foreground` on colored cards | Tinted darker shade of the hue |
| 5 | Contrast / accessibility | Yellow button + white text | Dark text on yellow / darken yellow |
| 6 | Consistent light source | Down-right button vs. straight-down card shadows | One shadow direction |
| 7 | Hierarchy via weight & color | Pervasive 12px text; weak tier contrast | Bigger body; lean on weight/color |
| 8 | Generous whitespace | `px-1 py-1` buttons; tight cards | More padding, larger targets |

---

*Reference: Adam Wathan & Steve Schoger, “Refactoring UI.”*
